package com.avenra.integration.infrastructure;

import com.avenra.platform.administration.HealthContributor;
import com.avenra.platform.administration.UsageContributor;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/** Connections and deliveries, for administrators (ADR-036). */
@Component
@Order(60)
class IntegrationFigures implements UsageContributor, HealthContributor {

    private final JdbcClient jdbc;

    IntegrationFigures(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Figure> usage(UUID organizationId) {
        long active = jdbc.sql(
                        "select count(*) from integration_connections where organization_id = :org and status = 'ACTIVE'")
                .param("org", organizationId)
                .query(Long.class)
                .single();
        return List.of(new Figure("integrations.active", "Active integrations", active));
    }

    @Override
    public List<Check> health(UUID organizationId, OffsetDateTime since) {
        long paused = jdbc.sql(
                        "select count(*) from integration_connections where organization_id = :org and status = 'PAUSED'")
                .param("org", organizationId)
                .query(Long.class)
                .single();
        long failed = jdbc.sql("""
                        select count(*) from integration_deliveries
                        where organization_id = :org and status = 'FAILED' and created_at >= :since
                        """)
                .param("org", organizationId)
                .param("since", since)
                .query(Long.class)
                .single();
        return List.of(
                new Check("integrations.paused", "Paused integrations", paused, paused > 0),
                new Check("integrations.failed_deliveries", "Failed deliveries", failed, failed > 0));
    }
}
