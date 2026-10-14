package com.avenra.document;

import com.avenra.document.application.DocumentStorage;
import com.avenra.document.application.MalwareScanner;
import com.avenra.document.application.MalwareScanner.ScannerUnavailableException;
import com.avenra.document.domain.FileNames;
import com.avenra.document.domain.FileTypes;
import com.avenra.document.infrastructure.DocumentRepository;
import com.avenra.document.infrastructure.DocumentRepository.VersionRow;
import com.avenra.platform.AvenraProperties;
import com.avenra.platform.web.ApiException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Accepting, storing and serving files (ADR-019, ADR-021). Other modules decide who may upload or
 * download; this module decides what is accepted: size, type by content, and a clean malware scan.
 *
 * <p>Uploading has two steps so that slow work happens outside database transactions:
 * {@link #prepare} (spool, check, scan) and then {@link #store} inside the caller's transaction.
 */
@Service
public class Documents {

    /** Who uploaded: a signed-in user or a request link (exactly one). */
    public record Uploader(@Nullable UUID userId, @Nullable UUID requestLinkId) {

        public static Uploader user(UUID userId) {
            return new Uploader(userId, null);
        }

        public static Uploader requestLink(UUID linkId) {
            return new Uploader(null, linkId);
        }
    }

    /** File extensions accepted for upload, for people choosing a file (ADR-019). */
    public static final List<String> ACCEPTED_EXTENSIONS = FileTypes.ACCEPTED_EXTENSIONS;

    /** A checked and scanned upload, held in a private temporary file until closed. */
    public static final class PreparedFile implements AutoCloseable {

        private final Path file;
        private final String fileName;
        private final FileTypes.FileType type;
        private final long size;
        private final byte[] sha256;
        private final MalwareScanner.Verdict verdict;

        private PreparedFile(
                Path file,
                String fileName,
                FileTypes.FileType type,
                long size,
                byte[] sha256,
                MalwareScanner.Verdict verdict) {
            this.file = file;
            this.fileName = fileName;
            this.type = type;
            this.size = size;
            this.sha256 = sha256.clone();
            this.verdict = verdict;
        }

        public boolean infected() {
            return verdict.infected();
        }

        public String sha256Hex() {
            return HexFormat.of().formatHex(sha256);
        }

        @Override
        public void close() {
            try {
                Files.deleteIfExists(file);
            } catch (IOException ignored) {
                // The temporary directory is cleaned by the operating system as a last resort.
            }
        }
    }

    /** A stored version as other modules see it. */
    public record StoredVersion(
            UUID documentId,
            int version,
            String fileName,
            String contentType,
            long sizeBytes,
            String sha256Hex,
            boolean clean,
            OffsetDateTime uploadedAt) {}

    /** A clean version ready to be streamed to an authorized caller. */
    public record Download(StoredVersion version, InputStream content) {}

    private final DocumentRepository repository;
    private final DocumentStorage storage;
    private final MalwareScanner scanner;
    private final long maxBytes;
    private final Clock clock;

    Documents(
            DocumentRepository repository,
            DocumentStorage storage,
            MalwareScanner scanner,
            AvenraProperties properties,
            Clock clock) {
        this.repository = repository;
        this.storage = storage;
        this.scanner = scanner;
        this.maxBytes = properties.web().maxUploadSize().toBytes();
        this.clock = clock;
    }

    /**
     * Spools, sizes, hashes, type-checks and scans an upload. Never call inside a database
     * transaction: scanning can take seconds. The caller must close the result.
     */
    @Transactional(propagation = Propagation.NEVER)
    public PreparedFile prepare(InputStream content, @Nullable String declaredName) {
        Path file = null;
        try {
            file = Files.createTempFile("avenra-upload-", ".bin");
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            long size;
            try (var in = new DigestInputStream(content, digest);
                    OutputStream out = Files.newOutputStream(file)) {
                size = copyAtMost(in, out, maxBytes);
            }
            if (size == 0) {
                throw new ApiException("FILE_EMPTY", HttpStatus.BAD_REQUEST, "The file is empty.");
            }
            String name = declaredName == null ? "" : declaredName;
            var type = FileTypes.detect(file, name)
                    .orElseThrow(() -> new ApiException(
                            "FILE_TYPE_NOT_ALLOWED",
                            HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                            "This type of file is not accepted. Use PDF, Word, Excel, PowerPoint, CSV, text, PNG or"
                                    + " JPEG."));
            var verdict = scan(file);
            var prepared = new PreparedFile(file, FileNames.sanitize(name, type), type, size, digest.digest(), verdict);
            file = null;
            return prepared;
        } catch (IOException failure) {
            throw new UncheckedIOException(failure);
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        } finally {
            if (file != null) {
                try {
                    Files.deleteIfExists(file);
                } catch (IOException ignored) {
                    // see PreparedFile.close
                }
            }
        }
    }

    /**
     * Stores a prepared file as the next version of the requirement's document, inside the caller's
     * tenant transaction. Infected files are stored under the quarantine prefix and recorded, but
     * never served. The caller must hold a lock that serializes uploads for the requirement.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public StoredVersion store(PreparedFile file, UUID organizationId, UUID requirementId, Uploader uploader) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        UUID documentId = repository.documentForRequirement(organizationId, requirementId, now);
        int version = repository.nextVersion(documentId);
        String key = "org/" + organizationId + "/documents/" + documentId + "/v" + version;
        if (file.infected()) {
            key = "quarantine/" + key;
        }
        try {
            storage.put(key, file.file, file.type.contentType(), file.sha256);
        } catch (DocumentStorage.StorageUnavailableException failure) {
            throw storageUnavailable();
        }
        var row = new VersionRow(
                documentId,
                version,
                organizationId,
                file.fileName,
                file.type.contentType(),
                file.size,
                file.sha256,
                key,
                file.infected() ? "INFECTED" : "CLEAN",
                file.verdict.signature(),
                uploader.userId(),
                uploader.requestLinkId(),
                now);
        repository.insertVersion(row);
        return toStored(row);
    }

    /** The signature that detected malware in a prepared file, for the audit trail. */
    public @Nullable String detection(PreparedFile file) {
        return file.verdict.signature();
    }

    /** Metadata of versions visible to the current transaction. */
    @Transactional(propagation = Propagation.MANDATORY)
    public List<StoredVersion> versions(Collection<UUID> documentIds) {
        return repository.findVersions(documentIds).stream()
                .map(Documents::toStored)
                .toList();
    }

    /** Opens a clean version of the organization's document; anything else is not found. */
    @Transactional(propagation = Propagation.MANDATORY)
    public Download open(UUID organizationId, UUID documentId, int version) {
        var row = repository.findVersion(organizationId, documentId, version).orElseThrow(Documents::unavailable);
        if (!"CLEAN".equals(row.scanStatus())) {
            throw unavailable();
        }
        try {
            return new Download(toStored(row), storage.get(row.storageKey()));
        } catch (DocumentStorage.StorageUnavailableException failure) {
            throw storageUnavailable();
        }
    }

    private MalwareScanner.Verdict scan(Path file) {
        try {
            return scanner.scan(file);
        } catch (ScannerUnavailableException unavailable) {
            throw new ApiException(
                    "SCANNER_UNAVAILABLE",
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Files cannot be checked right now, so the upload was not accepted. Try again later.");
        }
    }

    private long copyAtMost(InputStream in, OutputStream out, long limit) throws IOException {
        byte[] buffer = new byte[64 * 1024];
        long total = 0;
        int read;
        while ((read = in.read(buffer)) != -1) {
            total += read;
            if (total > limit) {
                throw new ApiException(
                        "FILE_TOO_LARGE",
                        HttpStatus.CONTENT_TOO_LARGE,
                        "The file is larger than " + limit / (1024 * 1024) + " MB.");
            }
            out.write(buffer, 0, read);
        }
        return total;
    }

    private static ApiException storageUnavailable() {
        return new ApiException(
                "STORAGE_UNAVAILABLE",
                HttpStatus.SERVICE_UNAVAILABLE,
                "Files are unavailable right now. Try again later.");
    }

    private static ApiException unavailable() {
        return new ApiException(
                "DOCUMENT_UNAVAILABLE", HttpStatus.NOT_FOUND, "This document does not exist or cannot be opened.");
    }

    private static StoredVersion toStored(VersionRow row) {
        return new StoredVersion(
                row.documentId(),
                row.version(),
                row.fileName(),
                row.contentType(),
                row.sizeBytes(),
                HexFormat.of().formatHex(row.sha256()),
                "CLEAN".equals(row.scanStatus()),
                row.uploadedAt().withOffsetSameInstant(ZoneOffset.UTC));
    }
}
