package com.avenra.work;

import static com.avenra.work.WorkTestSupport.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.BrowserClient;
import com.avenra.IntegrationTest;
import com.avenra.IntegrationTestBase;
import com.avenra.TestAccounts;
import com.avenra.TestOutbox;
import com.avenra.TestServices;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

/**
 * Documents and malware scanning through the API (Phase 3 criteria 3.8 and 3.9): types decided by
 * content, size limit, checksum, versions that are never overwritten, tenant-prefixed storage keys,
 * downloads only through authorized calls and only as attachments, and every upload scanned, with
 * infected files quarantined, audited and never served. Uses the real ClamAV and the EICAR file.
 */
@IntegrationTest
class DocumentsIT extends IntegrationTestBase {

    /** {@code avenra.web.max-upload-size} in the test profile. */
    private static final int MAX_UPLOAD = 256 * 1024;

    @LocalServerPort
    private int port;

    @Autowired
    private TestOutbox outbox;

    private record Setup(BrowserClient user, UUID organization, UUID work, UUID requirement, String path) {}

    private Setup setup() {
        var user = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        UUID organization = user.createOrganization("Documents Ltd");
        UUID work = createWork(user, organization, "Collect statements");
        UUID requirement = requirement(user, organization, work, "Bank statement", "DOCUMENT", true);
        return new Setup(
                user,
                organization,
                work,
                requirement,
                org(organization) + "/work/" + work + "/requirements/" + requirement);
    }

    @Test
    void anAcceptedFileIsStoredWithItsChecksumAndDownloadedOnlyAsAnAttachment() throws Exception {
        var s = setup();
        byte[] content = pdf("statement");
        var item = created(s.user().upload(s.path() + "/file", "../../etc/Statement \"Q1\".PDF", content, Map.of()))
                .body();
        var document = item.get("document");
        assertThat(document.get("contentType").asString()).isEqualTo("application/pdf");
        assertThat(document.get("scanStatus").asString()).isEqualTo("CLEAN");
        assertThat(document.get("version").asInt()).isEqualTo(1);
        assertThat(document.get("sizeBytes").asLong()).isEqualTo(content.length);
        assertThat(document.get("sha256").asString()).isEqualTo(sha256(content));
        assertThat(document.get("fileName").asString()).isEqualTo("Statement Q1.pdf");
        assertThat(item.get("source").get("type").asString()).isEqualTo("TEAM_MEMBER");

        UUID documentId = UUID.fromString(document.get("documentId").asString());
        var download = s.user().download(org(s.organization()) + "/documents/" + documentId + "/versions/1/content");
        assertThat(download.statusCode()).isEqualTo(200);
        assertThat(download.body()).isEqualTo(content);
        assertThat(download.headers().firstValue("Content-Disposition").orElseThrow())
                .startsWith("attachment");
        assertThat(download.headers().firstValue("Content-Type").orElseThrow()).isEqualTo("application/pdf");
        assertThat(download.headers().firstValue("X-Content-Type-Options").orElseThrow())
                .isEqualTo("nosniff");
        assertThat(download.headers().firstValue("Cache-Control").orElseThrow()).contains("no-store");

        // Stored under the tenant's prefix in the private bucket.
        String key = "org/" + s.organization() + "/documents/" + documentId + "/v1";
        try (var s3 = TestServices.s3Client()) {
            byte[] stored = s3.getObjectAsBytes(
                            r -> r.bucket(TestServices.S3_BUCKET).key(key))
                    .asByteArray();
            assertThat(stored).isEqualTo(content);
        }
        assertThat(auditActions(s.organization())).contains("work.document.uploaded", "document.downloaded");
    }

    @Test
    void everyUploadIsANewVersionAndEarlierVersionsStayAvailable() {
        var s = setup();
        byte[] first = pdf("first");
        byte[] second = pdf("second");
        var one = created(s.user().upload(s.path() + "/file", "a.pdf", first, Map.of()))
                .body();
        var repeat = created(s.user().upload(s.path() + "/file", "a.pdf", first, Map.of()))
                .body();
        assertThat(repeat.get("id").asString()).isEqualTo(one.get("id").asString());
        var two = created(s.user().upload(s.path() + "/file", "a.pdf", second, Map.of()))
                .body();
        assertThat(two.get("document").get("version").asInt()).isEqualTo(2);
        String documentId = two.get("document").get("documentId").asString();
        assertThat(one.get("document").get("documentId").asString()).isEqualTo(documentId);

        String base = org(s.organization()) + "/documents/" + documentId + "/versions/";
        assertThat(s.user().download(base + "1/content").body()).isEqualTo(first);
        assertThat(s.user().download(base + "2/content").body()).isEqualTo(second);
        assertThat(ok(s.user().get(s.path() + "/items")).body().size()).isEqualTo(2);
    }

    @Test
    void typesAreDecidedByContentNotByNameOrDeclaredType() {
        var s = setup();
        assertThat(created(s.user().upload(s.path() + "/file", "report.docx", docx(), Map.of()))
                        .body()
                        .get("document")
                        .get("contentType")
                        .asString())
                .isEqualTo("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n', 0, 0, 0, 0};
        assertThat(created(s.user().upload(s.path() + "/file", "scan.jpg", png, Map.of()))
                        .body()
                        .get("document")
                        .get("fileName")
                        .asString())
                .isEqualTo("scan.png");
        assertThat(created(s.user().upload(s.path() + "/file", "figures.csv", "a,b\n1,2\n".getBytes(), Map.of()))
                        .body()
                        .get("document")
                        .get("contentType")
                        .asString())
                .isEqualTo("text/csv");

        byte[] executable = {'M', 'Z', (byte) 0x90, 0, 3, 0, 0, 0};
        var disguised = s.user().upload(s.path() + "/file", "invoice.pdf", executable, Map.of());
        assertThat(disguised.status()).isEqualTo(415);
        assertThat(disguised.code()).isEqualTo("FILE_TYPE_NOT_ALLOWED");
        var plainZip = s.user().upload(s.path() + "/file", "archive.docx", zip(List.of("payload.bin")), Map.of());
        assertThat(plainZip.code()).isEqualTo("FILE_TYPE_NOT_ALLOWED");
        var binary = s.user().upload(s.path() + "/file", "notes.txt", new byte[] {'a', 0, 'b'}, Map.of());
        assertThat(binary.code()).isEqualTo("FILE_TYPE_NOT_ALLOWED");
        assertThat(s.user()
                        .upload(s.path() + "/file", "empty.pdf", new byte[0], Map.of())
                        .code())
                .isEqualTo("FILE_EMPTY");
    }

    @Test
    void filesOverTheLimitAreRefused() {
        var s = setup();
        byte[] justOver = new byte[MAX_UPLOAD + 1];
        System.arraycopy(pdf("x"), 0, justOver, 0, 8);
        var tooLarge = s.user().upload(s.path() + "/file", "big.pdf", justOver, Map.of());
        assertThat(tooLarge.status()).isEqualTo(413);
        assertThat(tooLarge.code()).isEqualTo("FILE_TOO_LARGE");
        var farTooLarge = s.user().upload(s.path() + "/file", "huge.pdf", new byte[MAX_UPLOAD * 2], Map.of());
        assertThat(farTooLarge.status()).isEqualTo(413);
        byte[] exactly = new byte[MAX_UPLOAD];
        System.arraycopy(pdf("x"), 0, exactly, 0, 8);
        assertThat(s.user()
                        .upload(s.path() + "/file", "max.pdf", exactly, Map.of())
                        .status())
                .isEqualTo(201);
    }

    @Test
    void malwareIsBlockedQuarantinedAndAudited() {
        var s = setup();
        var response = s.user().upload(s.path() + "/file", "harmless.txt", eicar(), Map.of());
        assertThat(response.status()).isEqualTo(422);
        assertThat(response.code()).isEqualTo("FILE_REJECTED");

        // Recorded as an infected version under the quarantine prefix, never as a submission.
        var versions = ownerQuery(
                "select v.scan_status, v.scan_signature, v.storage_key, d.id from document_versions v"
                        + " join documents d on d.id = v.document_id where d.requirement_id = ?",
                s.requirement());
        assertThat(versions).hasSize(1);
        assertThat(versions.getFirst().get(0)).isEqualTo("INFECTED");
        assertThat((String) versions.getFirst().get(1)).containsIgnoringCase("eicar");
        String key = (String) versions.getFirst().get(2);
        assertThat(key).startsWith("quarantine/org/" + s.organization() + "/");
        assertThat(ok(s.user().get(s.path() + "/items")).body().size()).isZero();
        assertThat(requirementOf(work(s.user(), s.organization(), s.work()), s.requirement())
                        .get("state")
                        .asString())
                .isEqualTo("MISSING");
        assertThat(auditActions(s.organization())).contains("document.malware_detected");

        // The infected version cannot be downloaded, and nothing sits under the normal prefix.
        UUID documentId = (UUID) versions.getFirst().get(3);
        var download = s.user().get(org(s.organization()) + "/documents/" + documentId + "/versions/1/content");
        assertThat(download.status()).isEqualTo(404);
        assertThat(download.code()).isEqualTo("DOCUMENT_UNAVAILABLE");
        try (var s3 = TestServices.s3Client()) {
            String normal = key.substring("quarantine/".length());
            assertThat(org.assertj.core.api.Assertions.catchThrowable(() ->
                            s3.headObject(r -> r.bucket(TestServices.S3_BUCKET).key(normal))))
                    .isNotNull();
            assertThat(s3.headObject(r -> r.bucket(TestServices.S3_BUCKET).key(key))
                            .contentLength())
                    .isEqualTo(eicar().length);
        } catch (NoSuchKeyException unexpected) {
            throw new AssertionError(unexpected);
        }
    }

    @Test
    void documentsOfAnotherTenantCannotBeDownloaded() {
        var s = setup();
        var item = created(s.user().upload(s.path() + "/file", "a.pdf", pdf("private"), Map.of()))
                .body();
        String documentId = item.get("document").get("documentId").asString();
        var mallory = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        UUID malloryOrg = mallory.createOrganization("Mallory");
        assertThat(mallory.get(org(malloryOrg) + "/documents/" + documentId + "/versions/1/content")
                        .status())
                .isEqualTo(404);
        assertThat(mallory.get(org(s.organization()) + "/documents/" + documentId + "/versions/1/content")
                        .status())
                .isEqualTo(404);
        assertThat(mallory.upload(
                                org(malloryOrg) + "/work/" + s.work() + "/requirements/" + s.requirement() + "/file",
                                "a.pdf",
                                pdf("x"),
                                Map.of())
                        .status())
                .isEqualTo(404);
    }

    @Test
    void valueRequirementsRefuseFilesAndDocumentRequirementsRefuseValues() {
        var s = setup();
        assertThat(s.user().post(s.path() + "/value", Map.of("value", "x")).code())
                .isEqualTo("WRONG_SUBMISSION_KIND");
        UUID text = requirement(s.user(), s.organization(), s.work(), "Name", "TEXT", true);
        String textPath = org(s.organization()) + "/work/" + s.work() + "/requirements/" + text;
        assertThat(s.user()
                        .upload(textPath + "/file", "a.pdf", pdf("x"), Map.of())
                        .code())
                .isEqualTo("WRONG_SUBMISSION_KIND");
    }

    private static String sha256(byte[] content) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content));
    }
}
