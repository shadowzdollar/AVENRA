package com.avenra.organization.application;

import com.avenra.audit.AuditHistory;
import com.avenra.contract.v1.model.AdministrationOverview;
import com.avenra.contract.v1.model.AdministrationOverviewHealth;
import com.avenra.contract.v1.model.AuditEvent;
import com.avenra.contract.v1.model.AuditPage;
import com.avenra.contract.v1.model.HealthCheck;
import com.avenra.contract.v1.model.RolePermissions;
import com.avenra.contract.v1.model.UsageFigure;
import com.avenra.identity.UserDirectory;
import com.avenra.organization.OrganizationAccess;
import com.avenra.organization.domain.Permission;
import com.avenra.organization.domain.Role;
import com.avenra.platform.administration.HealthContributor;
import com.avenra.platform.administration.UsageContributor;
import com.avenra.platform.web.ApiException;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import tools.jackson.databind.json.JsonMapper;

/**
 * The organization's administration (ADR-036): audit history, what each role may do, and usage and
 * health collected from the modules that own the data. A view only; every change still goes
 * through the module that owns it.
 */
@Service
public class AdministrationService {

    /** Health looks at this much of the recent past. */
    static final Duration HEALTH_WINDOW = Duration.ofHours(24);

    private static final List<String> CSV_COLUMNS = List.of(
            "occurredAt", "action", "actorUserId", "actorName", "resourceType", "resourceId", "requestId", "details");

    private final OrganizationAccess access;
    private final AuditHistory history;
    private final UserDirectory users;
    private final List<UsageContributor> usage;
    private final List<HealthContributor> health;
    private final JsonMapper json;
    private final Clock clock;

    AdministrationService(
            OrganizationAccess access,
            AuditHistory history,
            UserDirectory users,
            List<UsageContributor> usage,
            List<HealthContributor> health,
            JsonMapper json,
            Clock clock) {
        this.access = access;
        this.history = history;
        this.users = users;
        this.usage = usage;
        this.health = health;
        this.json = json;
        this.clock = clock;
    }

    public AuditPage audit(UUID userId, UUID organizationId, AuditHistory.Filter filter, @Nullable String cursor) {
        requireWindow(filter);
        return access.run(userId, organizationId, Permission.AUDIT_READ, granted -> {
            var page = history.page(organizationId, filter, cursor);
            var names = names(page.entries());
            return new AuditPage(page.entries().stream()
                            .map(entry -> toApi(entry, names))
                            .toList())
                    .nextCursor(page.nextCursor());
        });
    }

    /** The filtered history as CSV, newest first (RFC 4180, cells safe to open in a spreadsheet). */
    public String exportAudit(UUID userId, UUID organizationId, AuditHistory.Filter filter) {
        requireWindow(filter);
        return access.run(userId, organizationId, Permission.AUDIT_READ, granted -> {
            var entries = history.export(organizationId, filter);
            var names = names(entries);
            var csv = new StringBuilder(String.join(",", CSV_COLUMNS)).append("\r\n");
            for (var entry : entries) {
                csv.append(row(
                                entry.occurredAt()
                                        .withOffsetSameInstant(ZoneOffset.UTC)
                                        .toString(),
                                entry.action(),
                                text(entry.actorUserId()),
                                entry.actorUserId() == null ? "" : names.getOrDefault(entry.actorUserId(), ""),
                                text(entry.resourceType()),
                                text(entry.resourceId()),
                                text(entry.requestId()),
                                json.writeValueAsString(entry.details())))
                        .append("\r\n");
            }
            return csv.toString();
        });
    }

    /** Roles from most to least authority, as {@link Role} enforces them. */
    public List<RolePermissions> roles(UUID userId, UUID organizationId) {
        return access.run(
                userId,
                organizationId,
                Permission.MEMBERS_READ,
                granted -> Arrays.stream(Role.values())
                        .map(role -> new RolePermissions(
                                com.avenra.contract.v1.model.Role.fromValue(role.name()),
                                Arrays.stream(Permission.values())
                                        .filter(role::grants)
                                        .map(Permission::code)
                                        .toList()))
                        .toList());
    }

    public AdministrationOverview overview(UUID userId, UUID organizationId) {
        return access.run(userId, organizationId, Permission.ORGANIZATION_MANAGE, granted -> {
            OffsetDateTime since = OffsetDateTime.now(clock).minus(HEALTH_WINDOW);
            var figures = usage.stream()
                    .flatMap(contributor -> contributor.usage(organizationId).stream())
                    .map(figure -> new UsageFigure(figure.key(), figure.label(), figure.value()))
                    .toList();
            var checks = health.stream()
                    .flatMap(contributor -> contributor.health(organizationId, since).stream())
                    .toList();
            boolean attention = checks.stream().anyMatch(HealthContributor.Check::attention);
            return new AdministrationOverview(
                    figures,
                    new AdministrationOverviewHealth(
                            attention
                                    ? AdministrationOverviewHealth.StatusEnum.ATTENTION
                                    : AdministrationOverviewHealth.StatusEnum.OK,
                            checks.stream()
                                    .map(check -> new HealthCheck(
                                            check.key(),
                                            check.label(),
                                            check.value(),
                                            check.attention()
                                                    ? HealthCheck.StatusEnum.ATTENTION
                                                    : HealthCheck.StatusEnum.OK))
                                    .toList()));
        });
    }

    private static void requireWindow(AuditHistory.Filter filter) {
        if (filter.from() != null && filter.to() != null && !filter.from().isBefore(filter.to())) {
            throw ApiException.invalid("from", "must be before to");
        }
    }

    private Map<UUID, String> names(List<AuditHistory.Entry> entries) {
        var people = users.findAll(entries.stream()
                .map(AuditHistory.Entry::actorUserId)
                .filter(Objects::nonNull)
                .distinct()
                .toList());
        return people.values().stream()
                .collect(java.util.stream.Collectors.toMap(
                        UserDirectory.UserSummary::id, UserDirectory.UserSummary::displayName));
    }

    private static AuditEvent toApi(AuditHistory.Entry entry, Map<UUID, String> names) {
        return new AuditEvent(
                        entry.id(),
                        entry.occurredAt().withOffsetSameInstant(ZoneOffset.UTC),
                        entry.action(),
                        entry.details())
                .actorUserId(entry.actorUserId())
                .actorName(entry.actorUserId() == null ? null : names.get(entry.actorUserId()))
                .resourceType(entry.resourceType())
                .resourceId(entry.resourceId())
                .requestId(entry.requestId());
    }

    private static String text(@Nullable Object value) {
        return value == null ? "" : value.toString();
    }

    private static String row(String... cells) {
        return String.join(
                ",", Arrays.stream(cells).map(AdministrationService::cell).toList());
    }

    /**
     * Quotes a cell, and keeps a spreadsheet from treating it as a formula (a value starting with
     * {@code = + - @}, tab or carriage return gets a leading apostrophe).
     */
    static String cell(String value) {
        String safe = !value.isEmpty() && "=+-@\t\r".indexOf(value.charAt(0)) >= 0 ? "'" + value : value;
        return "\"" + safe.replace("\"", "\"\"") + "\"";
    }
}
