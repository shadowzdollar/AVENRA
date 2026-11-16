package com.avenra.ai;

import com.avenra.ai.infrastructure.AiRepository;
import com.avenra.ai.infrastructure.AiRepository.InvocationRow;
import com.avenra.ai.infrastructure.AiServiceClient;
import com.avenra.audit.AuditLog;
import com.avenra.platform.entitlements.Entitlements;
import com.avenra.platform.tenancy.TenantScope;
import com.avenra.platform.tenancy.TenantTransactions;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.tracing.Tracer;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * What other modules may ask of AI (ADR-029, ADR-030): whether an organization lets its documents be
 * read, and reading one. Every call is recorded, successful or not, in a transaction of its own, so
 * the record survives a retry of the work that caused it.
 */
@Component
@EnableConfigurationProperties(AiProperties.class)
public class Ai {

    public static final String DOCUMENT_READ = "document.read";
    public static final String WORK_PLAN = "work.plan";

    /** A field the rules ask for: its name and {@code TEXT}, {@code NUMBER} or {@code DATE}. */
    public record FieldRequest(String name, String kind) {}

    /**
     * @param attempt the job attempt that makes this call, recorded with it
     */
    public record ReadRequest(
            UUID organizationId,
            UUID documentId,
            int version,
            String contentType,
            byte[] content,
            List<String> kinds,
            List<FieldRequest> fields,
            int attempt) {}

    public sealed interface ReadOutcome permits Read, NotRead {}

    public record Read(DocumentReading reading, UUID invocationId) implements ReadOutcome {}

    /**
     * @param retryable whether the same call may succeed later
     * @param detail why, in words fit for a person
     */
    public record NotRead(
            Reason reason, boolean retryable, @Nullable UUID invocationId, String detail) implements ReadOutcome {}

    public enum Reason {
        SWITCHED_OFF,
        DAILY_LIMIT,
        /** The plan's monthly calls are used up, or the subscription is not active (ADR-037). */
        PLAN_LIMIT,
        FAILED
    }

    private final AiRepository repository;
    private final AiServiceClient client;
    private final TenantTransactions transactions;
    private final AuditLog audit;
    private final AiProperties properties;
    private final Entitlements entitlements;
    private final MeterRegistry meters;
    private final Tracer tracer;
    private final Clock clock;

    Ai(
            AiRepository repository,
            AiServiceClient client,
            TenantTransactions transactions,
            AuditLog audit,
            AiProperties properties,
            Entitlements entitlements,
            MeterRegistry meters,
            Tracer tracer,
            Clock clock) {
        this.repository = repository;
        this.client = client;
        this.transactions = transactions;
        this.audit = audit;
        this.properties = properties;
        this.entitlements = entitlements;
        this.meters = meters;
        this.tracer = tracer;
        this.clock = clock;
    }

    /** Whether the organization lets its documents be read automatically. Off without a setting. */
    @Transactional(propagation = Propagation.MANDATORY)
    public boolean documentReadingEnabled(UUID organizationId) {
        return repository
                .settings(organizationId)
                .map(AiRepository.SettingsRow::documentReading)
                .orElse(false);
    }

    /**
     * Reads a document with the AI service. Must run in the organization's own scope (a job), never
     * in a client's or a person's request. Checks the setting and the daily limit first; nothing is
     * sent when either says no.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public ReadOutcome readDocument(ReadRequest request) {
        UUID organizationId = request.organizationId();
        if (!documentReadingEnabled(organizationId)) {
            return new NotRead(
                    Reason.SWITCHED_OFF,
                    false,
                    null,
                    "Automatic document reading is switched off for this organization.");
        }
        if (repository.totalsSince(organizationId, startOfToday()).calls() >= properties.dailyCallLimit()) {
            meters.counter("avenra.ai.limited", "purpose", DOCUMENT_READ).increment();
            return new NotRead(
                    Reason.DAILY_LIMIT,
                    false,
                    null,
                    "The organization reached today's limit of automatic readings; the document was not read.");
        }
        if (!entitlements.hasRoom(organizationId, Entitlements.Limit.AI_CALLS_MONTH, 1)) {
            meters.counter("avenra.ai.limited", "purpose", DOCUMENT_READ).increment();
            return new NotRead(
                    Reason.PLAN_LIMIT,
                    false,
                    null,
                    "The organization's plan allows no more assistant calls this month; the document was not read.");
        }
        var fields = request.fields().stream()
                .map(field -> new AiServiceClient.Field(field.name(), field.kind()))
                .toList();
        var result = client.readDocument(request.contentType(), request.content(), request.kinds(), fields);
        return switch (result) {
            case AiServiceClient.Success success -> {
                UUID id = record(subject(request), success.invocation(), "SUCCEEDED", null);
                yield new Read(success.reading(), id);
            }
            case AiServiceClient.Failure failure -> {
                UUID id = failure.invocation() == null
                        ? null
                        : record(subject(request), failure.invocation(), outcome(failure.code()), failure.code());
                yield new NotRead(Reason.FAILED, failure.retryable(), id, failureText(failure.code()));
            }
        };
    }

    /** Whether the organization lets the assistant plan its work (ADR-033). Off without a setting. */
    @Transactional(propagation = Propagation.MANDATORY)
    public boolean workPlanningEnabled(UUID organizationId) {
        return repository
                .settings(organizationId)
                .map(AiRepository.SettingsRow::workPlanning)
                .orElse(false);
    }

    /** What the planner is told about a work item: the team's own description of it, as data. */
    public record PlanRequest(
            UUID organizationId,
            UUID workId,
            UUID requestedBy,
            String title,
            @Nullable String description,
            @Nullable String workType,
            List<String> existingRequirements,
            List<String> tools,
            int attempt) {}

    public sealed interface PlanOutcome permits Planned, NotPlanned {}

    /** A validated plan; still untrusted until the tool gateway checks each step (ADR-033). */
    public record Planned(WorkPlan plan, UUID invocationId, long costMicros) implements PlanOutcome {}

    public record NotPlanned(
            Reason reason, boolean retryable, @Nullable UUID invocationId, long costMicros, String detail)
            implements PlanOutcome {}

    /** Asks the AI service for a plan. Same rules as reading: setting first, daily limit, recorded. */
    @Transactional(propagation = Propagation.MANDATORY)
    public PlanOutcome planWork(PlanRequest request) {
        UUID organizationId = request.organizationId();
        if (!workPlanningEnabled(organizationId)) {
            return new NotPlanned(
                    Reason.SWITCHED_OFF, false, null, 0, "Work planning is switched off for this organization.");
        }
        if (repository.totalsSince(organizationId, startOfToday()).calls() >= properties.dailyCallLimit()) {
            meters.counter("avenra.ai.limited", "purpose", WORK_PLAN).increment();
            return new NotPlanned(
                    Reason.DAILY_LIMIT, false, null, 0, "The organization reached today's limit of AI calls.");
        }
        if (!entitlements.hasRoom(organizationId, Entitlements.Limit.AI_CALLS_MONTH, 1)) {
            meters.counter("avenra.ai.limited", "purpose", WORK_PLAN).increment();
            return new NotPlanned(
                    Reason.PLAN_LIMIT,
                    false,
                    null,
                    0,
                    "The organization's plan allows no more assistant calls this month.");
        }
        var subject = new Subject(
                organizationId,
                WORK_PLAN,
                request.workId(),
                null,
                request.requestedBy(),
                request.attempt(),
                "ai.work_planned",
                "work");
        var result = client.planWork(request);
        return switch (result) {
            case AiServiceClient.PlanSuccess success -> {
                UUID id = record(subject, success.invocation(), "SUCCEEDED", null);
                yield new Planned(success.plan(), id, cost(success.invocation()));
            }
            case AiServiceClient.Failure failure -> {
                UUID id = failure.invocation() == null
                        ? null
                        : record(subject, failure.invocation(), outcome(failure.code()), failure.code());
                yield new NotPlanned(
                        Reason.FAILED,
                        failure.retryable(),
                        id,
                        failure.invocation() == null ? 0 : cost(failure.invocation()),
                        "The assistant could not plan this work ("
                                + failure.code().toLowerCase(java.util.Locale.ROOT) + ").");
            }
        };
    }

    private static long cost(AiServiceClient.Invocation invocation) {
        return invocation.estimatedCostMicros() == null ? 0 : invocation.estimatedCostMicros();
    }

    /** What a recorded call was about. */
    private record Subject(
            UUID organizationId,
            String purpose,
            @Nullable UUID subjectId,
            @Nullable Integer subjectVersion,
            @Nullable UUID actor,
            int attempt,
            String auditAction,
            String resourceType) {}

    private static Subject subject(ReadRequest request) {
        return new Subject(
                request.organizationId(),
                DOCUMENT_READ,
                request.documentId(),
                request.version(),
                null,
                request.attempt(),
                "ai.document_read",
                "document");
    }

    private UUID record(
            Subject request, AiServiceClient.Invocation invocation, String outcome, @Nullable String errorCode) {
        UUID id = UUID.randomUUID();
        var span = tracer.currentSpan();
        var row = new InvocationRow(
                id,
                request.organizationId(),
                request.purpose(),
                request.subjectId(),
                request.subjectVersion(),
                request.actor(),
                invocation.provider(),
                invocation.modelRequested(),
                invocation.model(),
                invocation.promptName(),
                invocation.promptVersion(),
                invocation.promptSha256(),
                invocation.inputTokens(),
                invocation.outputTokens(),
                invocation.cacheReadTokens(),
                invocation.cacheWriteTokens(),
                invocation.latencyMs(),
                invocation.estimatedCostMicros(),
                outcome,
                errorCode,
                request.attempt(),
                span == null ? null : span.context().traceId(),
                OffsetDateTime.now(clock));
        transactions.runSeparately(TenantScope.system(request.organizationId()), () -> {
            repository.insertInvocation(row);
            var event = AuditLog.Event.of(request.auditAction(), request.organizationId(), request.actor())
                    .detail("invocationId", id.toString())
                    .detail("outcome", outcome);
            if (request.subjectId() != null) {
                event = event.resource(request.resourceType(), request.subjectId());
            }
            if (request.subjectVersion() != null) {
                event = event.detail("version", request.subjectVersion());
            }
            audit.record(event);
            return null;
        });
        meters.counter("avenra.ai.invocations", "purpose", request.purpose(), "outcome", outcome)
                .increment();
        if (invocation.estimatedCostMicros() != null) {
            meters.counter(
                            "avenra.ai.cost.micros",
                            "purpose",
                            request.purpose(),
                            "model",
                            String.valueOf(invocation.model()))
                    .increment(invocation.estimatedCostMicros());
        }
        return id;
    }

    private static String outcome(String code) {
        return switch (code) {
            case "REFUSED", "INVALID_OUTPUT", "TRUNCATED" -> code;
            default -> "FAILED";
        };
    }

    private static String failureText(String code) {
        return switch (code) {
            case "REFUSED" -> "The document could not be read automatically.";
            case "INVALID_OUTPUT", "TRUNCATED" -> "The automatic reading was not usable and was discarded.";
            case "UNREADABLE_DOCUMENT" -> "The document could not be opened for automatic reading.";
            default -> "Automatic reading is unavailable right now.";
        };
    }

    OffsetDateTime startOfToday() {
        return LocalDate.now(clock.withZone(ZoneOffset.UTC)).atStartOfDay().atOffset(ZoneOffset.UTC);
    }
}
