package com.avenra.work.application;

import com.avenra.audit.AuditLog;
import com.avenra.work.domain.ExceptionType;
import com.avenra.work.infrastructure.ExceptionRepository;
import com.avenra.work.infrastructure.ExceptionRepository.ExceptionRow;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Raises business exceptions (ADR-024). Raising twice for the same open source does nothing. */
@Component
class Exceptions {

    private final ExceptionRepository repository;
    private final AuditLog audit;
    private final MeterRegistry metrics;
    private final Clock clock;

    Exceptions(ExceptionRepository repository, AuditLog audit, MeterRegistry metrics, Clock clock) {
        this.repository = repository;
        this.audit = audit;
        this.metrics = metrics;
        this.clock = clock;
    }

    /**
     * @param description what happened and what a person needs to do; never secrets or payloads
     * @return whether a new exception was raised
     */
    @Transactional(propagation = Propagation.MANDATORY)
    boolean raise(
            UUID organizationId,
            @Nullable UUID workId,
            ExceptionType type,
            String description,
            String sourceType,
            String sourceId) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        var row = new ExceptionRow(
                UUID.randomUUID(),
                organizationId,
                workId,
                type,
                type.severity(),
                description,
                sourceType,
                sourceId,
                com.avenra.work.domain.ExceptionStatus.OPEN,
                null,
                null,
                now,
                now,
                null,
                null);
        if (!repository.raise(row)) {
            return false;
        }
        var event = AuditLog.Event.of("work.exception.raised", organizationId, null)
                .resource("exception", row.id())
                .detail("type", type.name());
        audit.record(workId == null ? event : event.detail("workId", workId.toString()));
        metrics.counter("avenra.exception.raised", "type", type.name()).increment();
        return true;
    }
}
