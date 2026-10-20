package com.avenra.work.infrastructure;

import com.avenra.platform.administration.HealthContributor;
import com.avenra.platform.administration.UsageContributor;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/** Work and its exceptions, for administrators (ADR-036). */
@Component
@Order(20)
class WorkFigures implements UsageContributor, HealthContributor {

    private final JdbcClient jdbc;

    WorkFigures(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Figure> usage(UUID organizationId) {
        return jdbc.sql("""
                        select count(*) as total,
                               count(*) filter (where status not in ('COMPLETED', 'CANCELLED')) as open,
                               count(*) filter (where status = 'COMPLETED') as completed,
                               (select count(*) from clients c where c.organization_id = :org) as clients
                        from work where organization_id = :org
                        """)
                .param("org", organizationId)
                .query((rs, row) -> List.of(
                        new Figure("clients", "Clients", rs.getLong("clients")),
                        new Figure("work.total", "Work", rs.getLong("total")),
                        new Figure("work.open", "Open work", rs.getLong("open")),
                        new Figure("work.completed", "Completed work", rs.getLong("completed"))))
                .single();
    }

    @Override
    public List<Check> health(UUID organizationId, OffsetDateTime since) {
        long high = jdbc.sql("""
                        select count(*) from work_exceptions
                        where organization_id = :org and severity = 'HIGH'
                          and status not in ('RESOLVED', 'DISMISSED')
                        """).param("org", organizationId).query(Long.class).single();
        return List.of(new Check("exceptions.high_open", "Open high-severity exceptions", high, high > 0));
    }
}
