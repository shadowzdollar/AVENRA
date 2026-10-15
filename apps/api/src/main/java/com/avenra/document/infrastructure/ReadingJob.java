package com.avenra.document.infrastructure;

import com.avenra.ai.Ai;
import com.avenra.document.DocumentEvents;
import com.avenra.document.DocumentReadings;
import com.avenra.document.application.DocumentStorage;
import com.avenra.platform.jobs.JobFailure;
import com.avenra.platform.jobs.JobHandler;
import com.avenra.platform.jobs.JobWorker;
import java.io.IOException;
import java.io.InputStream;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.json.JsonMapper;

/**
 * Makes a pending reading (ADR-031): sends the clean file to the AI service through {@link Ai},
 * settles the reading once, and announces it so the answer is verified again. Transient failures
 * are retried by the job engine; everything else settles the reading as failed or skipped.
 */
@Configuration(proxyBeanMethods = false)
class ReadingJob {

    @Bean
    JobHandler documentReadHandler(
            ReadingRepository readings,
            DocumentRepository documents,
            DocumentStorage storage,
            Ai ai,
            JsonMapper json,
            ApplicationEventPublisher events,
            Clock clock) {
        return JobHandler.of(DocumentReadings.READ, job -> {
            UUID readingId = UUID.fromString(JobWorker.text(job.payload(), "readingId"));
            var reading = readings.findForUpdate(readingId).orElse(null);
            if (reading == null || !"PENDING".equals(reading.status())) {
                return;
            }
            UUID org = reading.organizationId();
            var version = documents
                    .findVersion(org, reading.documentId(), reading.version())
                    .orElse(null);
            if (version == null || !"CLEAN".equals(version.scanStatus())) {
                settle(
                        readings,
                        documents,
                        events,
                        clock,
                        reading,
                        "SKIPPED",
                        "The file is not available for reading.",
                        null,
                        null);
                return;
            }
            var spec = json.readValue(reading.spec(), DocumentReadings.Spec.class);
            byte[] content;
            try (InputStream in = storage.get(version.storageKey())) {
                content = in.readAllBytes();
            } catch (DocumentStorage.StorageUnavailableException | IOException unavailable) {
                throw new JobFailure.Retryable("Storage unavailable", null);
            }
            var outcome = ai.readDocument(new Ai.ReadRequest(
                    org,
                    reading.documentId(),
                    reading.version(),
                    version.contentType(),
                    content,
                    spec.kinds(),
                    spec.fields(),
                    job.attempt()));
            switch (outcome) {
                case Ai.Read read ->
                    settle(
                            readings,
                            documents,
                            events,
                            clock,
                            reading,
                            "DONE",
                            null,
                            json.writeValueAsString(read.reading()),
                            read.invocationId());
                case Ai.NotRead notRead
                when notRead.retryable() && !job.lastAttempt() ->
                    throw new JobFailure.Retryable("AI service: " + notRead.detail(), null);
                case Ai.NotRead notRead -> {
                    String status = notRead.reason() == Ai.Reason.FAILED ? "FAILED" : "SKIPPED";
                    settle(
                            readings,
                            documents,
                            events,
                            clock,
                            reading,
                            status,
                            notRead.detail(),
                            null,
                            notRead.invocationId());
                }
            }
        });
    }

    private static void settle(
            ReadingRepository readings,
            DocumentRepository documents,
            ApplicationEventPublisher events,
            Clock clock,
            ReadingRepository.ReadingRow reading,
            String status,
            @Nullable String reason,
            @Nullable String result,
            @Nullable UUID invocationId) {
        readings.settle(reading.id(), status, reason, result, invocationId, OffsetDateTime.now(clock));
        events.publishEvent(new DocumentEvents.Read(
                reading.organizationId(),
                reading.documentId(),
                reading.version(),
                documents.requirementOf(reading.documentId()).orElse(null)));
    }
}
