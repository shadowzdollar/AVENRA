package com.avenra.document.infrastructure;

import com.avenra.audit.AuditLog;
import com.avenra.document.DocumentEvents;
import com.avenra.document.application.DocumentStorage;
import com.avenra.document.application.MalwareScanner;
import com.avenra.platform.jobs.Job;
import com.avenra.platform.jobs.JobFailure;
import com.avenra.platform.jobs.JobHandler;
import com.avenra.platform.jobs.JobSchedule;
import com.avenra.platform.jobs.JobWorker;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Rescans stored files (ADR-021 amendment) so files stored before a signature update are checked
 * again. A daily sweep picks the versions scanned longest ago; each version is one tenant job.
 */
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(Rescans.Settings.class)
class Rescans {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(Rescans.class);

    /**
     * @param every how often the sweep runs
     * @param olderThan rescan versions whose last scan is older than this
     * @param batch versions per sweep at most
     */
    @ConfigurationProperties("avenra.documents.rescan")
    record Settings(
            @DefaultValue("1d") Duration every,
            @DefaultValue("7d") Duration olderThan,
            @DefaultValue("500") int batch) {}

    static final String RESCAN = "document.rescan";

    @Bean
    JobSchedule rescanSchedule(Settings settings) {
        return new JobSchedule("sweep-rescans", "sweep.rescans", settings.every());
    }

    @Bean
    JobHandler rescanSweep(JdbcClient jdbc, Settings settings) {
        return new JobHandler() {
            @Override
            public String type() {
                return "sweep.rescans";
            }

            @Override
            public void handle(Job job) {
                jdbc.sql("select sweep_rescans(:older, :batch)")
                        .param("older", (int) settings.olderThan().toSeconds())
                        .param("batch", settings.batch())
                        .query(Integer.class)
                        .single();
            }
        };
    }

    @Bean
    JobHandler rescanHandler(
            DocumentRepository repository,
            DocumentStorage storage,
            MalwareScanner scanner,
            AuditLog audit,
            ApplicationEventPublisher events,
            Clock clock) {
        return new JobHandler() {
            @Override
            public String type() {
                return RESCAN;
            }

            @Override
            public void handle(Job job) {
                UUID org = job.organizationId();
                UUID documentId = UUID.fromString(JobWorker.text(job.payload(), "documentId"));
                int version = job.payload().get("version").asInt();
                var row = repository
                        .findVersionForUpdate(org, documentId, version)
                        .orElse(null);
                if (row == null || !"CLEAN".equals(row.scanStatus())) {
                    return;
                }
                MalwareScanner.Verdict verdict;
                var file = temporaryFile();
                try {
                    try (var content = storage.get(row.storageKey())) {
                        Files.copy(content, file, StandardCopyOption.REPLACE_EXISTING);
                    }
                    verdict = scanner.scan(file);
                } catch (MalwareScanner.ScannerUnavailableException
                        | DocumentStorage.StorageUnavailableException
                        | IOException unavailable) {
                    throw new JobFailure.Retryable("Scanner or storage unavailable", null);
                } finally {
                    try {
                        Files.deleteIfExists(file);
                    } catch (IOException ignored) {
                        // the temporary directory is cleaned by the operating system as a last resort
                    }
                }
                OffsetDateTime now = OffsetDateTime.now(clock);
                if (!verdict.infected()) {
                    repository.markScanned(documentId, version, now);
                    return;
                }
                String quarantineKey = "quarantine/" + row.storageKey();
                storage.copy(row.storageKey(), quarantineKey);
                repository.quarantine(documentId, version, quarantineKey, verdict.signature(), now);
                audit.record(AuditLog.Event.of("document.malware_detected", org, null)
                        .resource("document", documentId)
                        .detail("version", version)
                        .detail("signature", String.valueOf(verdict.signature()))
                        .detail("on", "rescan"));
                events.publishEvent(new DocumentEvents.Quarantined(
                        org,
                        documentId,
                        version,
                        repository.requirementOf(documentId).orElse(null),
                        verdict.signature()));
                // The original is removed only after the quarantine is committed. Should that delete fail,
                // the stray object is never served: the version now points at the quarantine copy.
                String original = row.storageKey();
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        try {
                            storage.delete(original);
                        } catch (RuntimeException failure) {
                            log.atWarn()
                                    .addKeyValue("document.id", documentId)
                                    .setCause(failure)
                                    .log("Could not remove the original of a quarantined file");
                        }
                    }
                });
            }
        };
    }

    private static java.nio.file.Path temporaryFile() {
        try {
            return Files.createTempFile("avenra-rescan-", ".bin");
        } catch (IOException failure) {
            throw new UncheckedIOException(failure);
        }
    }
}
