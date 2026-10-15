package com.avenra.ai.application;

import com.avenra.ai.AiProperties;
import com.avenra.ai.infrastructure.AiRepository;
import com.avenra.audit.AuditLog;
import com.avenra.contract.v1.model.AiInvocation;
import com.avenra.contract.v1.model.AiSettings;
import com.avenra.contract.v1.model.AiUsage;
import com.avenra.contract.v1.model.AiUsageToday;
import com.avenra.organization.OrganizationAccess;
import com.avenra.organization.domain.Permission;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.springframework.stereotype.Service;

/** The organization's AI setting and its usage records (ADR-030). */
@Service
public class AiSettingsService {

    private static final int LATEST = 100;

    private final AiRepository repository;
    private final OrganizationAccess access;
    private final AuditLog audit;
    private final AiProperties properties;
    private final Clock clock;

    AiSettingsService(
            AiRepository repository, OrganizationAccess access, AuditLog audit, AiProperties properties, Clock clock) {
        this.repository = repository;
        this.access = access;
        this.audit = audit;
        this.properties = properties;
        this.clock = clock;
    }

    public AiSettings get(UUID userId, UUID organizationId) {
        return access.run(userId, organizationId, Permission.ORGANIZATION_READ, caller -> settings(organizationId));
    }

    /** Only owners hold {@code ai.manage}; the change is audited with its old and new value. */
    public AiSettings update(UUID userId, UUID organizationId, boolean documentReading) {
        return access.run(userId, organizationId, Permission.AI_MANAGE, caller -> {
            boolean before = repository
                    .settings(organizationId)
                    .map(AiRepository.SettingsRow::documentReading)
                    .orElse(false);
            repository.saveSettings(organizationId, documentReading, userId, OffsetDateTime.now(clock));
            if (before != documentReading) {
                audit.record(AuditLog.Event.of("ai.settings_changed", organizationId, userId)
                        .resource("organization", organizationId)
                        .detail("documentReading", documentReading));
            }
            return settings(organizationId);
        });
    }

    public AiUsage usage(UUID userId, UUID organizationId) {
        return access.run(userId, organizationId, Permission.AI_READ, caller -> {
            OffsetDateTime today =
                    LocalDate.now(clock.withZone(ZoneOffset.UTC)).atStartOfDay().atOffset(ZoneOffset.UTC);
            var totals = repository.totalsSince(organizationId, today);
            return new AiUsage(
                    new AiUsageToday(
                            totals.calls(), totals.inputTokens(), totals.outputTokens(), totals.estimatedCostMicros()),
                    properties.dailyCallLimit(),
                    repository.latest(organizationId, LATEST).stream()
                            .map(AiSettingsService::toApi)
                            .toList());
        });
    }

    private AiSettings settings(UUID organizationId) {
        var api = new AiSettings(false, properties.dailyCallLimit());
        repository
                .settings(organizationId)
                .ifPresent(row -> api.documentReading(row.documentReading())
                        .updatedAt(row.updatedAt().withOffsetSameInstant(ZoneOffset.UTC))
                        .updatedByUserId(row.updatedBy()));
        return api;
    }

    private static AiInvocation toApi(AiRepository.InvocationRow row) {
        return new AiInvocation(
                        row.id(),
                        AiInvocation.PurposeEnum.fromValue(row.purpose()),
                        row.provider(),
                        row.modelRequested(),
                        row.promptName(),
                        row.promptVersion(),
                        row.inputTokens(),
                        row.outputTokens(),
                        row.cacheReadTokens(),
                        row.latencyMs(),
                        AiInvocation.OutcomeEnum.fromValue(row.outcome()),
                        row.attempt(),
                        row.createdAt().withOffsetSameInstant(ZoneOffset.UTC))
                .subjectId(row.subjectId())
                .subjectVersion(row.subjectVersion())
                .model(row.model())
                .estimatedCostMicros(row.estimatedCostMicros())
                .errorCode(row.errorCode());
    }
}
