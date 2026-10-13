package com.avenra.audit.infrastructure;

import com.avenra.audit.AuditLog;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

@Component
class JdbcAuditLog implements AuditLog {

    private final JdbcClient jdbc;
    private final JsonMapper json;
    private final Clock clock;

    JdbcAuditLog(JdbcClient jdbc, JsonMapper json, Clock clock) {
        this.jdbc = jdbc;
        this.json = json;
        this.clock = clock;
    }

    /** Joins the caller's transaction and fails if there is none: an audit event belongs to its action. */
    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void record(Event event) {
        jdbc.sql("""
                        insert into audit_events (id, occurred_at, organization_id, actor_user_id, action,
                                                  resource_type, resource_id, request_id, trace_id, details)
                        values (:id, :at, :org, :actor, :action, :type, :resource, :request, :trace, cast(:details as jsonb))
                        """)
                .param("id", UUID.randomUUID())
                .param("at", OffsetDateTime.now(clock))
                .param("org", event.organizationId())
                .param("actor", event.actorUserId())
                .param("action", event.action())
                .param("type", event.resourceType())
                .param("resource", event.resourceId())
                .param("request", MDC.get("requestId"))
                .param("trace", MDC.get("traceId"))
                .param("details", json.writeValueAsString(event.details()))
                .update();
    }
}
