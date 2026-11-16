package com.avenra.information.application;

import com.avenra.ai.Ai;
import com.avenra.document.DocumentEvents;
import com.avenra.document.DocumentReadings;
import com.avenra.document.Documents;
import com.avenra.information.InformationEvents;
import com.avenra.information.domain.Completeness.VerificationState;
import com.avenra.information.domain.RequirementKind;
import com.avenra.information.infrastructure.RequirementRepository;
import com.avenra.information.infrastructure.RequirementRepository.ItemRow;
import com.avenra.information.infrastructure.RequirementRepository.RequirementRow;
import com.avenra.platform.jobs.JobHandler;
import com.avenra.platform.jobs.JobQueue;
import com.avenra.platform.jobs.JobWorker;
import com.avenra.platform.tenancy.TenantTransactions;
import com.avenra.verification.Verification;
import com.avenra.verification.domain.Answer;
import com.avenra.verification.domain.Result;
import com.avenra.verification.domain.Rule;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Verifies answers and applies the rules' decision (ADR-027). Answers are verified in the
 * transaction that records them, so clients learn at once what is wrong; checks that need answers
 * the current scope cannot see are completed by a job in the organization's scope, which also
 * re-verifies answers whose consistency rules refer to the changed one.
 */
@Configuration(proxyBeanMethods = false)
class AnswerChecks {

    static final String VERIFY_RELATED = "information.verify_related";

    /** The least confidence for the platform to accept an answer on its own (product default). */
    static final BigDecimal AUTOMATIC_THRESHOLD = new BigDecimal("0.95");

    private final Verification verification;
    private final RequirementRepository requirements;
    private final Documents documents;
    private final DocumentReadings readings;
    private final TenantTransactions transactions;
    private final JobQueue jobs;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    AnswerChecks(
            Verification verification,
            RequirementRepository requirements,
            Documents documents,
            DocumentReadings readings,
            TenantTransactions transactions,
            JobQueue jobs,
            ApplicationEventPublisher events,
            Clock clock) {
        this.verification = verification;
        this.requirements = requirements;
        this.documents = documents;
        this.readings = readings;
        this.transactions = transactions;
        this.jobs = jobs;
        this.events = events;
        this.clock = clock;
    }

    /** Verifies a newly recorded answer, decides if the rules allow, and schedules the related checks. */
    @Transactional(propagation = Propagation.MANDATORY)
    Verification.Recorded checkNewAnswer(RequirementRow requirement, ItemRow item) {
        var recorded = verifyAndDecide(requirement, item);
        jobs.enqueue(JobQueue.Request.of(
                        VERIFY_RELATED,
                        requirement.organizationId(),
                        Map.of("workId", requirement.workId(), "requirementId", requirement.id(), "itemId", item.id()))
                .idempotencyKey(item.id().toString()));
        return recorded;
    }

    /**
     * Verifies the current answer of a requirement again (new rules, or a related answer changed).
     * A pending answer may now be decided; an accepted one that fails is reported, not changed.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    void recheckCurrent(RequirementRow requirement) {
        if (requirement.currentItemId() == null) {
            return;
        }
        var item = requirements.itemsByIds(List.of(requirement.currentItemId())).getFirst();
        if (item.verificationState() == VerificationState.PENDING) {
            verifyAndDecide(requirement, item);
        } else if (item.verificationState() == VerificationState.ACCEPTED) {
            var recorded = verify(requirement, item);
            if (recorded.result().status() == Result.Status.FAILED) {
                events.publishEvent(new InformationEvents.AcceptedAnswerInconsistent(
                        requirement.organizationId(),
                        requirement.workId(),
                        requirement.id(),
                        requirement.title(),
                        item.id(),
                        recorded.result().blockingProblems()));
            }
        }
    }

    private Verification.Recorded verifyAndDecide(RequirementRow requirement, ItemRow item) {
        var recorded = verify(requirement, item);
        Result result = recorded.result();
        if (item.verificationState() != VerificationState.PENDING) {
            return recorded;
        }
        OffsetDateTime now = OffsetDateTime.now(clock);
        var subject = subject(requirement, item);
        if (result.status() == Result.Status.FAILED) {
            String reason = String.join(" ", result.blockingProblems());
            if (requirements.decideByRules(item.id(), VerificationState.REJECTED, reason, now)) {
                verification.recordDecision(subject, false, "Rejected by the rules: " + reason);
                events.publishEvent(new InformationEvents.AnswerReviewed(
                        requirement.organizationId(),
                        requirement.workId(),
                        requirement.id(),
                        item.id(),
                        false,
                        reason,
                        null));
            }
        } else if (requirement.automatic()
                && result.status() == Result.Status.PASSED
                && result.confidence() != null
                && result.confidence().compareTo(AUTOMATIC_THRESHOLD) >= 0) {
            if (requirements.decideByRules(item.id(), VerificationState.ACCEPTED, null, now)) {
                verification.recordDecision(
                        subject,
                        false,
                        "Accepted automatically: every check passed (confidence " + result.confidence() + ")");
                events.publishEvent(new InformationEvents.AnswerReviewed(
                        requirement.organizationId(),
                        requirement.workId(),
                        requirement.id(),
                        item.id(),
                        true,
                        null,
                        null));
            }
        }
        return recorded;
    }

    private Verification.Recorded verify(RequirementRow requirement, ItemRow item) {
        List<Rule> rules = verification.rules(requirement.id(), requirement.rulesVersion());
        var recorded = verification.verify(
                subject(requirement, item),
                rules,
                requirement.rulesVersion(),
                answer(requirement, item, rules),
                related(requirement, rules));
        requirements.setConfidence(item.id(), recorded.result().confidence());
        return recorded;
    }

    /**
     * Current answers of the requirements the rules refer to. A requirement this scope cannot see
     * is left out (its checks are skipped); one without a usable answer maps to empty.
     */
    private Map<UUID, Optional<Answer>> related(RequirementRow requirement, List<Rule> rules) {
        var related = new HashMap<UUID, Optional<Answer>>();
        for (Rule rule : rules) {
            UUID other = rule.otherRequirementId();
            if (other == null || related.containsKey(other)) {
                continue;
            }
            requirements
                    .find(other)
                    .filter(row -> row.workId().equals(requirement.workId()))
                    .ifPresent(row -> related.put(other, currentAnswer(row)));
        }
        return related;
    }

    private Optional<Answer> currentAnswer(RequirementRow row) {
        if (row.currentItemId() == null) {
            return Optional.empty();
        }
        return requirements.itemsByIds(List.of(row.currentItemId())).stream()
                .filter(item -> item.verificationState() != VerificationState.REJECTED)
                .filter(item -> item.valueText() != null)
                .findFirst()
                .map(item -> Answer.value(kind(item.kind()), item.valueText()));
    }

    private Answer answer(RequirementRow requirement, ItemRow item, List<Rule> rules) {
        if (item.kind() != RequirementKind.DOCUMENT) {
            return Answer.value(kind(item.kind()), item.valueText());
        }
        var version = documents.versions(List.of(item.documentId())).stream()
                .filter(stored -> stored.version() == item.documentVersion())
                .findFirst()
                .orElseThrow();
        return Answer.document(new Answer.DocumentFacts(
                version.contentType(), version.sizeBytes(), version.sha256Hex(), reading(requirement, item, rules)));
    }

    /**
     * The automatic reading the document rules need (ADR-031), or {@code null} when no rule needs
     * one. Readings are only looked up and scheduled in the organization's scope; in a request
     * link's scope the checks wait, and the follow-up job completes them.
     */
    private Answer.@Nullable Reading reading(RequirementRow requirement, ItemRow item, List<Rule> rules) {
        var spec = spec(rules);
        if (spec.asksForNothing()) {
            return null;
        }
        if (transactions.organizationInScope().isEmpty()) {
            return Answer.Reading.unavailable("waiting for the document to be read");
        }
        var reading = readings.reading(requirement.organizationId(), item.documentId(), item.documentVersion(), spec);
        return switch (reading.status()) {
            case PENDING -> Answer.Reading.unavailable("waiting for the document to be read");
            case SKIPPED, FAILED ->
                Answer.Reading.unavailable(
                        reading.reason() == null ? "the document could not be read automatically" : reading.reason());
            case DONE -> {
                var result = java.util.Objects.requireNonNull(reading.result());
                yield new Answer.Reading(
                        Answer.Reading.Availability.AVAILABLE,
                        null,
                        result.kind() == null ? null : result.kind().label(),
                        result.fields().stream()
                                .map(field -> new Answer.ReadField(
                                        field.name(), field.found(), field.value(), field.quote(), field.located()))
                                .toList());
            }
        };
    }

    /** What the document rules ask a reading for: every kind label, every field. */
    static DocumentReadings.Spec spec(List<Rule> rules) {
        var kinds = new java.util.ArrayList<String>();
        var fields = new java.util.ArrayList<Ai.FieldRequest>();
        for (Rule rule : rules) {
            if (rule.type() == Rule.Type.DOCUMENT_KIND) {
                kinds.addAll(rule.values());
            } else if (rule.type() == Rule.Type.DOCUMENT_FIELD && rule.field() != null && rule.fieldKind() != null) {
                fields.add(new Ai.FieldRequest(rule.field(), rule.fieldKind().name()));
            }
        }
        return new DocumentReadings.Spec(kinds, fields);
    }

    /** A reading arrived: verify the answer that uses that document version again. */
    @EventListener
    void on(DocumentEvents.Read read) {
        if (read.requirementId() == null) {
            return;
        }
        var found = requirements.find(read.requirementId()).orElse(null);
        if (found == null) {
            return;
        }
        var requirement = requirements.findForUpdate(found.workId(), found.id()).orElse(null);
        if (requirement == null || requirement.currentItemId() == null) {
            return;
        }
        var item = requirements.itemsByIds(List.of(requirement.currentItemId())).getFirst();
        if (read.documentId().equals(item.documentId())
                && item.documentVersion() != null
                && item.documentVersion() == read.version()) {
            recheckCurrent(requirement);
        }
    }

    static Verification.Subject subject(RequirementRow requirement, ItemRow item) {
        return new Verification.Subject(
                requirement.organizationId(),
                requirement.workId(),
                requirement.id(),
                item.id(),
                item.documentId(),
                item.documentVersion());
    }

    static Answer.Kind kind(RequirementKind kind) {
        return Answer.Kind.valueOf(kind.name());
    }

    /** In the organization's scope: finish skipped checks of the answer, then re-check its dependents. */
    @Bean
    JobHandler verifyRelatedHandler() {
        return JobHandler.of(VERIFY_RELATED, job -> {
            UUID workId = UUID.fromString(JobWorker.text(job.payload(), "workId"));
            UUID requirementId = UUID.fromString(JobWorker.text(job.payload(), "requirementId"));
            UUID itemId = UUID.fromString(JobWorker.text(job.payload(), "itemId"));
            var requirement = requirements.findForUpdate(workId, requirementId).orElse(null);
            if (requirement == null) {
                return;
            }
            if (itemId.equals(requirement.currentItemId())) {
                var latest = verification.latest(List.of(itemId)).get(itemId);
                if (latest == null || latest.result().anySkipped()) {
                    recheckCurrent(requirement);
                }
            }
            verification.referring(job.organizationId(), requirementId).forEach((dependentId, version) -> {
                var dependent = requirements.findForUpdate(workId, dependentId).orElse(null);
                if (dependent != null && dependent.rulesVersion() == version) {
                    recheckCurrent(dependent);
                }
            });
        });
    }

    /** For callers outside this class that need the latest result of answers. */
    Map<UUID, Verification.Recorded> latest(List<UUID> itemIds) {
        return verification.latest(itemIds);
    }
}
