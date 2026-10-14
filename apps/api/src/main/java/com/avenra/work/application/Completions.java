package com.avenra.work.application;

import com.avenra.information.Information;
import com.avenra.platform.web.ApiException;
import com.avenra.platform.web.ErrorResponse;
import com.avenra.verification.Verification;
import com.avenra.work.domain.CompletionCriteria;
import com.avenra.work.infrastructure.ExceptionRepository;
import com.avenra.work.infrastructure.WorkRepository;
import com.avenra.work.infrastructure.WorkRepository.WorkRow;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Completion criteria and the completion manifest (ADR-028): work completes only when every
 * criterion is met, and completing it seals what was accepted, how it was checked and who decided.
 */
@Component
class Completions {

    private final Information information;
    private final Verification verification;
    private final ExceptionRepository exceptions;
    private final WorkRepository work;
    private final Clock clock;

    Completions(
            Information information,
            Verification verification,
            ExceptionRepository exceptions,
            WorkRepository work,
            Clock clock) {
        this.information = information;
        this.verification = verification;
        this.exceptions = exceptions;
        this.work = work;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    List<CompletionCriteria.Criterion> criteria(UUID organizationId, UUID workId) {
        var facts = information.completionFacts(organizationId, workId);
        return CompletionCriteria.of(
                information.completeness(organizationId, workId),
                facts.stream()
                        .filter(Information.CompletionFact::failedWithoutOverride)
                        .count(),
                exceptions.openHighForWork(organizationId, workId),
                work.openTasks(organizationId, workId));
    }

    /** @throws ApiException {@code COMPLETION_CRITERIA_UNMET} with every unmet criterion */
    @Transactional(propagation = Propagation.MANDATORY)
    void requireMet(UUID organizationId, UUID workId) {
        var unmet = criteria(organizationId, workId).stream()
                .filter(criterion -> !criterion.met())
                .toList();
        if (!unmet.isEmpty()) {
            throw new ApiException(
                    "COMPLETION_CRITERIA_UNMET",
                    HttpStatus.CONFLICT,
                    "The work cannot be completed yet: "
                            + String.join(
                                    "; ",
                                    unmet.stream()
                                            .map(CompletionCriteria.Criterion::description)
                                            .toList())
                            + ".",
                    unmet.stream()
                            .map(criterion -> new ErrorResponse.FieldProblem(
                                    criterion.name().name(),
                                    criterion.detail() == null ? criterion.description() : criterion.detail()))
                            .toList());
        }
    }

    /** Seals the manifest of work that has just been completed, in the same transaction. */
    @Transactional(propagation = Propagation.MANDATORY)
    void seal(WorkRow completed, WorkLifecycle.Actor actor) {
        OffsetDateTime now = OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
        var manifest = new LinkedHashMap<String, Object>();
        manifest.put("manifestVersion", 1);
        var workPart = new LinkedHashMap<String, Object>();
        workPart.put("id", completed.id().toString());
        workPart.put("organizationId", completed.organizationId().toString());
        workPart.put("title", completed.title());
        workPart.put("completedAt", now.toString());
        workPart.put("completedBy", actor.userId() != null ? "user:" + actor.userId() : "rule:" + actor.rule());
        manifest.put("work", workPart);
        manifest.put(
                "criteria",
                criteria(completed.organizationId(), completed.id()).stream()
                        .map(criterion -> Map.of("name", criterion.name().name(), "met", criterion.met()))
                        .toList());
        manifest.put(
                "requirements",
                information.completionFacts(completed.organizationId(), completed.id()).stream()
                        .map(Completions::entry)
                        .toList());
        verification.seal(completed.organizationId(), completed.id(), manifest);
    }

    private static Map<String, Object> entry(Information.CompletionFact fact) {
        var entry = new LinkedHashMap<String, Object>();
        entry.put("requirementId", fact.requirementId().toString());
        entry.put("title", fact.title());
        entry.put("kind", fact.kind());
        entry.put("required", fact.required());
        entry.put("state", fact.state());
        if (fact.itemId() != null) {
            var answer = new LinkedHashMap<String, Object>();
            answer.put("itemId", fact.itemId().toString());
            put(answer, "valueSha256", fact.answerFingerprint());
            if (fact.documentId() != null) {
                answer.put("documentId", fact.documentId().toString());
                answer.put("documentVersion", fact.documentVersion());
                put(answer, "documentSha256", fact.documentSha256());
            }
            entry.put("answer", answer);
            var decision = new LinkedHashMap<String, Object>();
            put(decision, "by", fact.decidedBy());
            put(
                    decision,
                    "userId",
                    fact.decidedByUserId() == null
                            ? null
                            : fact.decidedByUserId().toString());
            put(
                    decision,
                    "at",
                    fact.decidedAt() == null
                            ? null
                            : fact.decidedAt()
                                    .withOffsetSameInstant(ZoneOffset.UTC)
                                    .toString());
            put(decision, "overrideReason", fact.overrideReason());
            entry.put("decision", decision);
            var checks = new LinkedHashMap<String, Object>();
            put(
                    checks,
                    "verificationId",
                    fact.verificationId() == null ? null : fact.verificationId().toString());
            put(checks, "status", fact.verificationStatus());
            put(checks, "confidence", fact.confidence());
            checks.put("rulesVersion", fact.rulesVersion());
            entry.put("verification", checks);
        }
        return entry;
    }

    private static void put(Map<String, Object> map, String key, Object value) {
        if (value != null) {
            map.put(key, value);
        }
    }
}
