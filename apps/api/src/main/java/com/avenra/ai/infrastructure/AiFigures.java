package com.avenra.ai.infrastructure;

import com.avenra.platform.administration.UsageContributor;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/** Assistant use, for administrators (ADR-036). */
@Component
@Order(50)
class AiFigures implements UsageContributor {

    private final JdbcClient jdbc;
    private final Clock clock;

    AiFigures(JdbcClient jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    @Override
    public List<Figure> usage(UUID organizationId) {
        return jdbc.sql("""
                        select count(*) as calls, coalesce(sum(input_tokens + output_tokens), 0) as tokens
                        from ai_invocations where organization_id = :org and created_at >= :today
                        """)
                .param("org", organizationId)
                .param("today", LocalDate.now(clock).atStartOfDay().atOffset(ZoneOffset.UTC))
                .query((rs, row) -> List.of(
                        new Figure("ai.calls_today", "Assistant calls today", rs.getLong("calls")),
                        new Figure("ai.tokens_today", "Assistant tokens today", rs.getLong("tokens"))))
                .single();
    }
}
