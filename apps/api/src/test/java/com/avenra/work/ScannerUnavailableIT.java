package com.avenra.work;

import static com.avenra.work.WorkTestSupport.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.IntegrationTest;
import com.avenra.IntegrationTestBase;
import com.avenra.TestAccounts;
import com.avenra.TestOutbox;
import io.micrometer.core.instrument.MeterRegistry;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;

/**
 * Without a reachable malware scanner no upload is accepted (fail closed, ADR-021) and nothing is
 * stored, while everything else keeps working.
 */
@IntegrationTest
@TestPropertySource(properties = {"avenra.documents.scanner.port=1", "avenra.documents.scanner.connect-timeout=500ms"})
class ScannerUnavailableIT extends IntegrationTestBase {

    @LocalServerPort
    private int port;

    @Autowired
    private TestOutbox outbox;

    @Autowired
    private MeterRegistry registry;

    @Test
    void uploadsAreRefusedAndNothingIsKept() {
        var user = TestAccounts.signedIn(port, outbox, TestAccounts.newEmail());
        UUID organization = user.createOrganization("Fail Closed Ltd");
        UUID work = createWork(user, organization, "W");
        UUID requirement = requirement(user, organization, work, "Statement", "DOCUMENT", true);

        var response = user.upload(
                org(organization) + "/work/" + work + "/requirements/" + requirement + "/file",
                "a.pdf",
                pdf("x"),
                Map.of());
        assertThat(response.status()).isEqualTo(503);
        assertThat(response.code()).isEqualTo("SCANNER_UNAVAILABLE");
        assertThat(ownerQuery(
                                "select count(*) from document_versions v join documents d on d.id = v.document_id"
                                        + " where d.requirement_id = ?",
                                requirement)
                        .getFirst()
                        .getFirst())
                .isEqualTo(0L);
    }

    /** Only uploads stop: the rest of the API stays in service, and the outage is visible for alerting. */
    @Test
    void theRestOfTheApiStaysReadyAndTheOutageIsMeasured() {
        assertThat(get("/health/readiness").statusCode()).isEqualTo(200);
        assertThat(registry.get("avenra.malware_scanner.available").gauge().value())
                .isZero();
    }
}
