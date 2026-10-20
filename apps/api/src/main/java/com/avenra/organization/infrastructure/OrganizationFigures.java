package com.avenra.organization.infrastructure;

import com.avenra.platform.administration.UsageContributor;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/** People of the organization, for administrators (ADR-036). */
@Component
@Order(10)
class OrganizationFigures implements UsageContributor {

    private final JdbcClient jdbc;
    private final Clock clock;

    OrganizationFigures(JdbcClient jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    @Override
    public List<Figure> usage(UUID organizationId) {
        return jdbc.sql("""
                        select (select count(*) from memberships where organization_id = :org) as members,
                               (select count(*) from invitations
                                where organization_id = :org and accepted_at is null and revoked_at is null
                                  and expires_at > :now) as invitations
                        """)
                .param("org", organizationId)
                .param("now", OffsetDateTime.now(clock))
                .query((rs, row) -> List.of(
                        new Figure("members", "Members", rs.getLong("members")),
                        new Figure("invitations.pending", "Pending invitations", rs.getLong("invitations"))))
                .single();
    }
}
