package com.avenra.document;

import com.avenra.ai.Ai;
import com.avenra.ai.DocumentReading;
import com.avenra.document.infrastructure.DocumentRepository;
import com.avenra.document.infrastructure.ReadingRepository;
import com.avenra.document.infrastructure.ReadingRepository.ReadingRow;
import com.avenra.platform.jobs.JobQueue;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

/**
 * Automatic readings of document versions (ADR-031). A reading is made once per version and
 * reading spec, by a job in the organization's scope, and only while the organization has document
 * reading switched on. What it found is untrusted: callers use it for advisory checks only.
 */
@Component
public class DocumentReadings {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(DocumentReadings.class);

    public static final String READ = "document.read";

    /** The types that can be read in Phase 6; office files are not (ADR-031). */
    public static final Set<String> READABLE_TYPES =
            Set.of("application/pdf", "image/png", "image/jpeg", "text/plain", "text/csv");

    /** What the rules ask a reading for: kind labels and fields. */
    public record Spec(List<String> kinds, List<Ai.FieldRequest> fields) {

        public Spec {
            kinds = kinds.stream().map(String::strip).distinct().sorted().toList();
            var byName = new LinkedHashMap<String, Ai.FieldRequest>();
            fields.stream()
                    .sorted(Comparator.comparing(field -> field.name().toLowerCase(Locale.ROOT)))
                    .forEach(field -> byName.putIfAbsent(field.name().toLowerCase(Locale.ROOT), field));
            fields = List.copyOf(byName.values());
        }

        public boolean asksForNothing() {
            return kinds.isEmpty() && fields.isEmpty();
        }

        /** Canonical form: the same request always has the same hash. */
        String canonical() {
            var out = new StringBuilder("kinds:");
            kinds.forEach(kind -> out.append(kind.length()).append(':').append(kind));
            out.append("|fields:");
            fields.forEach(field -> out.append(field.name().length())
                    .append(':')
                    .append(field.name())
                    .append('=')
                    .append(field.kind())
                    .append(';'));
            return out.toString();
        }

        String hash() {
            try {
                return HexFormat.of()
                        .formatHex(MessageDigest.getInstance("SHA-256")
                                .digest(canonical().getBytes(StandardCharsets.UTF_8)));
            } catch (NoSuchAlgorithmException impossible) {
                throw new IllegalStateException(impossible);
            }
        }
    }

    public enum Status {
        PENDING,
        DONE,
        FAILED,
        SKIPPED
    }

    /**
     * @param reason why it was not read, or why reading failed; words fit for a person
     * @param result what was read, when {@link Status#DONE}
     */
    public record Reading(
            Status status,
            @Nullable String reason,
            @Nullable DocumentReading result,
            @Nullable OffsetDateTime readAt) {

        static Reading skipped(String reason) {
            return new Reading(Status.SKIPPED, reason, null, null);
        }
    }

    private final ReadingRepository readings;
    private final DocumentRepository documents;
    private final Ai ai;
    private final JobQueue jobs;
    private final JsonMapper json;
    private final Clock clock;

    DocumentReadings(
            ReadingRepository readings,
            DocumentRepository documents,
            Ai ai,
            JobQueue jobs,
            JsonMapper json,
            Clock clock) {
        this.readings = readings;
        this.documents = documents;
        this.ai = ai;
        this.jobs = jobs;
        this.json = json;
        this.clock = clock;
    }

    /**
     * The reading of a version for a spec, scheduling it when there is none yet. Must run in the
     * organization's scope. Nothing is scheduled while reading is switched off, for a file that is
     * not clean, or for a type that cannot be read.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public Reading reading(UUID organizationId, UUID documentId, int version, Spec spec) {
        String hash = spec.hash();
        var existing = readings.find(documentId, version, hash);
        if (existing.isPresent()) {
            return toReading(existing.get());
        }
        if (!ai.documentReadingEnabled(organizationId)) {
            return Reading.skipped("Automatic document reading is switched off for this organization.");
        }
        var row = documents.findVersion(organizationId, documentId, version).orElse(null);
        if (row == null || !"CLEAN".equals(row.scanStatus())) {
            return Reading.skipped("The file is not available for reading.");
        }
        if (!READABLE_TYPES.contains(row.contentType())) {
            return Reading.skipped("This type of file cannot be read automatically.");
        }
        UUID id = UUID.randomUUID();
        if (readings.insertPending(
                id,
                organizationId,
                documentId,
                version,
                hash,
                json.writeValueAsString(spec),
                OffsetDateTime.now(clock))) {
            jobs.enqueue(JobQueue.Request.of(READ, organizationId, Map.of("readingId", id))
                    .idempotencyKey(id.toString())
                    .maxAttempts(4));
        }
        return new Reading(Status.PENDING, null, null, null);
    }

    /** The latest reading of each version of the given documents, keyed {@code documentId/version}. */
    @Transactional(propagation = Propagation.MANDATORY)
    public Map<String, Reading> latest(Collection<UUID> documentIds) {
        var latest = new LinkedHashMap<String, Reading>();
        for (ReadingRow row : readings.latest(documentIds)) {
            latest.put(row.documentId() + "/" + row.version(), toReading(row));
        }
        return latest;
    }

    private Reading toReading(ReadingRow row) {
        OffsetDateTime readAt =
                row.completedAt() == null ? null : row.completedAt().withOffsetSameInstant(ZoneOffset.UTC);
        if (row.result() == null) {
            return new Reading(Status.valueOf(row.status()), row.reason(), null, readAt);
        }
        try {
            return new Reading(
                    Status.valueOf(row.status()),
                    row.reason(),
                    json.readValue(row.result(), DocumentReading.class),
                    readAt);
        } catch (JacksonException unreadable) {
            // A stored reading that no longer parses must not break every view of the work.
            log.warn("Stored document reading could not be read", unreadable);
            return new Reading(Status.FAILED, "The stored reading could not be read.", null, readAt);
        }
    }
}
