package com.avenra.analytics.application;

import com.avenra.contract.v1.model.AnalyticsMetric;
import com.avenra.contract.v1.model.AnalyticsPoint;
import com.avenra.contract.v1.model.AnalyticsReport;
import com.avenra.contract.v1.model.AnalyticsSeries;
import com.avenra.contract.v1.model.AnalyticsUnit;
import com.avenra.contract.v1.model.AnalyticsWorkType;
import com.avenra.organization.OrganizationAccess;
import com.avenra.organization.domain.Permission;
import com.avenra.platform.analytics.AnalyticsContributor;
import com.avenra.platform.analytics.AnalyticsContributor.Window;
import com.avenra.platform.web.ApiException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

/**
 * An organization's analytics over the last 7, 30 or 90 days, compared with the period before
 * (ADR-038). Each module reports on its own data, from indexed queries, fresh on every request
 * (ADR-039 removed the cache: people check analytics right after changing work).
 */
@Service
public class AnalyticsService {

    static final Set<Integer> PERIODS = Set.of(7, 30, 90);
    private final OrganizationAccess access;
    private final List<AnalyticsContributor> contributors;
    private final Clock clock;

    AnalyticsService(OrganizationAccess access, List<AnalyticsContributor> contributors, Clock clock) {
        this.access = access;
        this.contributors = contributors;
        this.clock = clock;
    }

    public AnalyticsReport report(UUID userId, UUID organizationId, int days) {
        if (!PERIODS.contains(days)) {
            throw ApiException.invalid("days", "must be 7, 30 or 90");
        }
        return access.run(userId, organizationId, Permission.ANALYTICS_READ, granted -> {
            return compute(organizationId, days, clock.instant());
        });
    }

    private AnalyticsReport compute(UUID organizationId, int days, Instant now) {
        OffsetDateTime to = now.atOffset(ZoneOffset.UTC);
        OffsetDateTime from = to.minusDays(days);
        var current = new Window(from, to);
        var previous = new Window(from.minusDays(days), from);
        var metrics = new ArrayList<AnalyticsMetric>();
        var series = new ArrayList<AnalyticsSeries>();
        var workTypes = new ArrayList<AnalyticsWorkType>();
        for (var contributor : contributors) {
            var contribution = contributor.analytics(organizationId, current, previous);
            contribution
                    .metrics()
                    .forEach(
                            metric -> metrics.add(new AnalyticsMetric(metric.key(), metric.label(), unit(metric.unit()))
                                    .value(decimal(metric.value()))
                                    .previous(decimal(metric.previous()))));
            contribution
                    .series()
                    .forEach(line -> series.add(new AnalyticsSeries(
                            line.key(),
                            line.label(),
                            unit(line.unit()),
                            AnalyticsSeries.IntervalEnum.fromValue(
                                    line.interval().name()),
                            line.points().stream()
                                    .map(point -> new AnalyticsPoint(point.start(), BigDecimal.valueOf(point.value())))
                                    .toList())));
            contribution
                    .workTypes()
                    .forEach(type -> workTypes.add(new AnalyticsWorkType(type.type(), type.created(), type.completed())
                            .completionRate(decimal(type.completionRate()))
                            .medianCompletionSeconds(decimal(type.medianCompletionSeconds()))));
        }
        return new AnalyticsReport(days, from, to, metrics, series, workTypes);
    }

    /** One decimal is enough for people. */
    private static @Nullable BigDecimal decimal(@Nullable Double value) {
        return value == null ? null : BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP);
    }

    private static AnalyticsUnit unit(AnalyticsContributor.Unit unit) {
        return AnalyticsUnit.fromValue(unit.name());
    }
}
