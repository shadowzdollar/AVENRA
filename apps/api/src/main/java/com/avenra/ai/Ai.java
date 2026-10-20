package com.avenra.ai;

import com.avenra.ai.infrastructure.AiRepository;
import com.avenra.ai.infrastructure.AiRepository.InvocationRow;
import com.avenra.ai.infrastructure.AiServiceClient;
import com.avenra.audit.AuditLog;
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
        FAILED
    }

    private final AiRepository repository;
    private final AiServiceClient client;
    private final TenantTransactions transactions;
    private final AuditLog audit;
    private final AiProperties properties;
    private final MeterRegistry meters;
    private final Tracer tracer;
    private final Clock clock;

    Ai(
            AiRepository repository,
            AiServiceClient client,
            TenantTransactions transactions,
            AuditLog audit,
            AiProperties properties,
            MeterRegistry meters,
            Tracer tracer,
            Clock clock) {
        this.repository = repository;
        this.client = client;
        this.transactions = transactions;
        this.audit = audit;
        this.properties = properties;
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
        var fields = request.fields().stream()
                .map(field -> new AiServiceClient.Field(field.name(), field.kind()))
                .toList();
        var result = client.readDocument(request.contentType(), request.content(), request.kinds(), fields);
        return switch (result) {
            case AiServiceClient.Success success -> {
                UUID id = record(request, success.invocation(), "SUCCEEDED", null);
                yield new Read(success.reading(), id);
            }
            case AiServiceClient.Failure failure -> {
                UUID id = failure.invocation() == null
                        ? null
                        : record(request, failure.invocation(), outcome(failure.code()), failure.code());
                yield new NotRead(Reason.FAILED, failure.retryable(), id, failureText(failure.code()));
            }
        };
    }

    private UUID record(
            ReadRequest request, AiServiceClient.Invocation invocation, String outcome, @Nullable String errorCode) {
        UUID id = UUID.randomUUID();
        var span = tracer.currentSpan();
        var row = new InvocationRow(
                id,
                request.organizationId(),
                DOCUMENT_READ,
                request.documentId(),
                request.version(),
                null,
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
            audit.record(AuditLog.Event.of("ai.document_read", request.organizationId(), null)
                    .resource("document", request.documentId())
                    .detail("version", request.version())
                    .detail("invocationId", id.toString())
                    .detail("outcome", outcome));
            return null;
        });
        meters.counter("avenra.ai.invocations", "purpose", DOCUMENT_READ, "outcome", outcome)
                .increment();
        if (invocation.estimatedCostMicros() != null) {
            meters.counter(
                            "avenra.ai.cost.micros",
                            "purpose",
                            DOCUMENT_READ,
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
