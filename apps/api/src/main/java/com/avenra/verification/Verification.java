package com.avenra.verification;

import com.avenra.platform.AvenraProperties;
import com.avenra.platform.crypto.SecureTokens;
import com.avenra.platform.web.ApiException;
import com.avenra.verification.domain.Answer;
import com.avenra.verification.domain.Result;
import com.avenra.verification.domain.Rule;
import com.avenra.verification.domain.RuleValidation;
import com.avenra.verification.domain.Verifier;
import com.avenra.verification.infrastructure.VerificationStore;
import com.avenra.verification.infrastructure.VerificationStore.CompletionRow;
import com.avenra.verification.infrastructure.VerificationStore.EvidenceRow;
import com.avenra.verification.infrastructure.VerificationStore.ResultRow;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.SerializationFeature;
import tools.jackson.databind.cfg.DateTimeFeature;
import tools.jackson.databind.json.JsonMapper;

/**
 * The verification module's API (ADR-026 to ADR-028): rule sets, verification of answers with
 * evidence, decisions as evidence, and sealed completion manifests. Every method runs inside the
 * caller's tenant transaction; callers have checked access.
 */
@Service
public class Verification {

    /** What is verified: an answer of a requirement of a work item, and its document, if any. */
    public record Subject(
            UUID organizationId,
            UUID workId,
            UUID requirementId,
            UUID itemId,
            @Nullable UUID documentId,
            @Nullable Integer documentVersion) {}

    /** A stored result. */
    public record Recorded(
            UUID id,
            UUID itemId,
            int rulesVersion,
            Result result,
            List<Map<String, String>> evidence,
            OffsetDateTime createdAt) {}

    public record EvidenceView(
            UUID id,
            UUID workId,
            @Nullable UUID requirementId,
            String kind,
            String referenceType,
            UUID referenceId,
            String description,
            @Nullable String fingerprint,
            OffsetDateTime createdAt) {}

    /** A sealed manifest and whether it still matches its hash. */
    public record Sealed(UUID workId, String manifest, String sha256, OffsetDateTime completedAt, boolean intact) {}

    private final VerificationStore store;
    private final MeterRegistry metrics;
    private final long maxUploadBytes;
    private final Clock clock;
    private final JsonMapper canonical;

    Verification(VerificationStore store, MeterRegistry metrics, AvenraProperties properties, Clock clock) {
        this.store = store;
        this.metrics = metrics;
        this.maxUploadBytes = properties.web().maxUploadSize().toBytes();
        this.clock = clock;
        this.canonical = JsonMapper.builder()
                .enable(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS)
                .disable(DateTimeFeature.WRITE_DATES_AS_TIMESTAMPS)
                .build();
    }

    /**
     * Validates rules for a requirement (ADR-027).
     *
     * @throws ApiException {@code INVALID_RULE} listing every problem
     */
    public void validate(List<Rule> rules, Answer.Kind kind, UUID requirementId, Map<UUID, Answer.Kind> siblings) {
        var problems = RuleValidation.problems(rules, kind, requirementId, siblings, maxUploadBytes);
        if (!problems.isEmpty()) {
            throw new ApiException(
                    "INVALID_RULE",
                    HttpStatus.BAD_REQUEST,
                    "Some rules are not valid: " + String.join("; ", problems) + ".",
                    problems.stream()
                            .map(problem -> new com.avenra.platform.web.ErrorResponse.FieldProblem("rules", problem))
                            .toList());
        }
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public List<Rule> saveRules(
            UUID organizationId, UUID requirementId, int version, List<Rule> rules, @Nullable UUID userId) {
        var stored = rules.stream().map(rule -> rule.withId(UUID.randomUUID())).toList();
        store.insertRules(organizationId, requirementId, version, stored, userId, OffsetDateTime.now(clock));
        return stored;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public List<Rule> rules(UUID requirementId, int version) {
        return version == 0 ? List.of() : store.rules(requirementId, version);
    }

    /** Requirements whose rules of the given version refer to {@code requirementId}. */
    @Transactional(propagation = Propagation.MANDATORY)
    public Map<UUID, Integer> referring(UUID organizationId, UUID requirementId) {
        return store.referring(organizationId, requirementId);
    }

    /**
     * Verifies an answer and records the result and its evidence: the answer (or document version)
     * with its fingerprint, and the verification itself.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public Recorded verify(
            Subject subject, List<Rule> rules, int rulesVersion, Answer answer, Map<UUID, Optional<Answer>> related) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        Result result = Verifier.verify(rules, answer, related, LocalDate.now(clock.withZone(ZoneOffset.UTC)));
        UUID id = UUID.randomUUID();
        var refs = new ArrayList<Map<String, String>>();
        if (answer.kind() == Answer.Kind.DOCUMENT && subject.documentId() != null) {
            refs.add(Map.of(
                    "type",
                    "document_version",
                    "id",
                    subject.documentId().toString(),
                    "version",
                    String.valueOf(subject.documentVersion())));
            evidence(
                    subject,
                    "DOCUMENT_VERSION",
                    "document_version",
                    subject.documentId(),
                    "Document version " + subject.documentVersion(),
                    answer.document() == null ? null : answer.document().sha256Hex(),
                    now);
        } else {
            refs.add(Map.of("type", "information_item", "id", subject.itemId().toString()));
            evidence(
                    subject,
                    "ANSWER",
                    "information_item",
                    subject.itemId(),
                    "Answer as received",
                    answer.value() == null ? null : fingerprint(answer.value()),
                    now);
        }
        store.insertResult(new ResultRow(
                id,
                subject.organizationId(),
                subject.workId(),
                subject.requirementId(),
                subject.itemId(),
                rulesVersion,
                result,
                refs,
                now));
        evidence(
                subject,
                "VERIFICATION",
                "verification",
                id,
                "Checked against rule version " + rulesVersion + ": "
                        + result.status().name().toLowerCase(java.util.Locale.ROOT) + " ("
                        + result.checks().size() + (result.checks().size() == 1 ? " check)" : " checks)"),
                null,
                now);
        metrics.counter(
                        "avenra.verification.completed",
                        "status",
                        result.status().name())
                .increment();
        return new Recorded(id, subject.itemId(), rulesVersion, result, refs, now);
    }

    /** A decision on an answer becomes evidence (ADR-028). */
    @Transactional(propagation = Propagation.MANDATORY)
    public void recordDecision(Subject subject, boolean byPerson, String description) {
        evidence(
                subject,
                byPerson ? "HUMAN_DECISION" : "SYSTEM_DECISION",
                "information_item",
                subject.itemId(),
                description,
                null,
                OffsetDateTime.now(clock));
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public Map<UUID, Recorded> latest(Collection<UUID> itemIds) {
        var latest = new java.util.LinkedHashMap<UUID, Recorded>();
        store.latestForItems(itemIds).forEach((item, row) -> latest.put(item, recorded(row)));
        return latest;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public List<Recorded> history(UUID requirementId) {
        return store.forRequirement(requirementId).stream()
                .map(Verification::recorded)
                .toList();
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public List<EvidenceView> evidence(UUID organizationId, UUID workId) {
        return store.evidence(organizationId, workId).stream()
                .map(Verification::view)
                .toList();
    }

    /** The organization's newest evidence across all work, optionally of one kind (ADR-039). */
    @Transactional(propagation = Propagation.MANDATORY)
    public List<EvidenceView> organizationEvidence(UUID organizationId, @Nullable String kind) {
        return store.organizationEvidence(organizationId, kind).stream()
                .map(Verification::view)
                .toList();
    }

    private static EvidenceView view(VerificationStore.EvidenceRow row) {
        return new EvidenceView(
                row.id(),
                row.workId(),
                row.requirementId(),
                row.kind(),
                row.referenceType(),
                row.referenceId(),
                row.description(),
                row.fingerprint(),
                row.createdAt());
    }

    /** Stores the completion manifest as canonical JSON with its SHA-256 (ADR-028). */
    @Transactional(propagation = Propagation.MANDATORY)
    public Sealed seal(UUID organizationId, UUID workId, Map<String, Object> manifest) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        String text = canonical.writeValueAsString(manifest);
        String sha = sha256(text);
        store.insertCompletion(organizationId, new CompletionRow(workId, text, sha, now));
        return new Sealed(workId, text, sha, now, true);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public Optional<Sealed> completion(UUID organizationId, UUID workId) {
        return store.completion(organizationId, workId)
                .map(row -> new Sealed(
                        row.workId(),
                        row.manifest(),
                        row.sha256(),
                        row.completedAt(),
                        sha256(row.manifest()).equals(row.sha256())));
    }

    /** SHA-256 of a canonical value: equal answers have equal fingerprints. */
    public static String fingerprint(String value) {
        return sha256(value);
    }

    private void evidence(
            Subject subject,
            String kind,
            String referenceType,
            UUID referenceId,
            String description,
            @Nullable String fingerprint,
            OffsetDateTime now) {
        store.insertEvidence(
                subject.organizationId(),
                new EvidenceRow(
                        UUID.randomUUID(),
                        subject.workId(),
                        subject.requirementId(),
                        kind,
                        referenceType,
                        referenceId,
                        description,
                        fingerprint,
                        now));
    }

    private static Recorded recorded(ResultRow row) {
        return new Recorded(row.id(), row.itemId(), row.rulesVersion(), row.result(), row.evidence(), row.createdAt());
    }

    private static String sha256(String text) {
        return HexFormat.of().formatHex(SecureTokens.hash(text));
    }
}
