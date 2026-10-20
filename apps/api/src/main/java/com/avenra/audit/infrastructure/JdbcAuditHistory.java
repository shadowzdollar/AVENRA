package com.avenra.audit.infrastructure;

import com.avenra.audit.AuditHistory;
import com.avenra.platform.web.ApiException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

@Component
class JdbcAuditHistory implements AuditHistory {

    private static final TypeReference<Map<String, Object>> DETAILS = new TypeReference<>() {};

    private final JdbcClient jdbc;
    private final JsonMapper json;

    JdbcAuditHistory(JdbcClient jdbc, JsonMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    @Override
    public Page page(UUID organizationId, Filter filter, @Nullable String cursor) {
        var entries = query(organizationId, filter, cursor == null ? null : Cursor.decode(cursor), PAGE_SIZE + 1);
        if (entries.size() <= PAGE_SIZE) {
            return new Page(entries, null);
        }
        var page = entries.subList(0, PAGE_SIZE);
        var last = page.getLast();
        return new Page(List.copyOf(page), new Cursor(last.occurredAt(), last.id()).encode());
    }

    @Override
    public List<Entry> export(UUID organizationId, Filter filter) {
        return query(organizationId, filter, null, EXPORT_LIMIT);
    }

    private List<Entry> query(UUID organizationId, Filter filter, @Nullable Cursor after, int limit) {
        var where = new ArrayList<String>();
        where.add("organization_id = :org");
        if (filter.actionPrefix() != null) {
            where.add("starts_with(action, :prefix)");
        }
        if (filter.actorUserId() != null) {
            where.add("actor_user_id = :actor");
        }
        if (filter.from() != null) {
            where.add("occurred_at >= :from");
        }
        if (filter.to() != null) {
            where.add("occurred_at < :to");
        }
        if (after != null) {
            where.add("(occurred_at, id) < (:afterAt, :afterId)");
        }
        var statement = jdbc.sql("select id, occurred_at, actor_user_id, action, resource_type, resource_id,"
                        + " request_id, details::text as details from audit_events where "
                        + String.join(" and ", where)
                        + " order by occurred_at desc, id desc limit :limit")
                .param("org", organizationId)
                .param("limit", limit);
        if (filter.actionPrefix() != null) {
            statement = statement.param("prefix", filter.actionPrefix());
        }
        if (filter.actorUserId() != null) {
            statement = statement.param("actor", filter.actorUserId());
        }
        if (filter.from() != null) {
            statement = statement.param("from", filter.from());
        }
        if (filter.to() != null) {
            statement = statement.param("to", filter.to());
        }
        if (after != null) {
            statement = statement.param("afterAt", after.at()).param("afterId", after.id());
        }
        return statement
                .query((rs, row) -> new Entry(
                        rs.getObject("id", UUID.class),
                        rs.getObject("occurred_at", OffsetDateTime.class),
                        rs.getObject("actor_user_id", UUID.class),
                        rs.getString("action"),
                        rs.getString("resource_type"),
                        rs.getObject("resource_id", UUID.class),
                        rs.getString("request_id"),
                        json.readValue(rs.getString("details"), DETAILS)))
                .list();
    }

    /** Where a page ended: the last entry's time (microseconds, as stored) and id. */
    private record Cursor(OffsetDateTime at, UUID id) {

        String encode() {
            Instant instant = at.toInstant();
            long micros = ChronoUnit.MICROS.between(Instant.EPOCH, instant);
            return Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString((micros + ":" + id).getBytes(StandardCharsets.UTF_8));
        }

        static Cursor decode(String cursor) {
            try {
                String[] parts =
                        new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8).split(":", 2);
                Instant instant = Instant.EPOCH.plus(Long.parseLong(parts[0]), ChronoUnit.MICROS);
                return new Cursor(instant.atOffset(ZoneOffset.UTC), UUID.fromString(parts[1]));
            } catch (IllegalArgumentException | ArrayIndexOutOfBoundsException e) {
                throw ApiException.invalid("cursor", "is not a cursor from a previous page");
            }
        }
    }
}
