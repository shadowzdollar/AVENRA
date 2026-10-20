package com.avenra.notification.infrastructure;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Notifications and preferences (ADR-035); every query runs under row-level security. */
@Repository
public class NotificationRepository {

    public record NotificationRow(
            UUID id,
            UUID organizationId,
            UUID userId,
            String category,
            String title,
            String body,
            @Nullable String link,
            String sourceType,
            String sourceId,
            String dedupeKey,
            String emailStatus,
            OffsetDateTime createdAt,
            @Nullable OffsetDateTime readAt) {}

    private static final String COLUMNS = """
            id, organization_id, user_id, category, title, body, link, source_type, source_id, dedupe_key,
            email_status, created_at, read_at""";

    private final JdbcClient jdbc;

    NotificationRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /** Creates the notification unless this person already has one with the key; true when new. */
    public boolean insert(NotificationRow row) {
        return Boolean.TRUE.equals(jdbc.sql("""
                        select notifications_create(:id, :org, :user, :category, :title, :body, :link, :sourceType,
                            :sourceId, :key, :email, :now)
                        """)
                .param("id", row.id())
                .param("org", row.organizationId())
                .param("user", row.userId())
                .param("category", row.category())
                .param("title", row.title())
                .param("body", row.body())
                .param("link", row.link())
                .param("sourceType", row.sourceType())
                .param("sourceId", row.sourceId())
                .param("key", row.dedupeKey())
                .param("email", row.emailStatus())
                .param("now", row.createdAt())
                .query(Boolean.class)
                .single());
    }

    public List<NotificationRow> forUser(UUID userId, int limit) {
        return jdbc.sql("select " + COLUMNS + " from notifications where user_id = :user"
                        + " order by created_at desc, id limit :limit")
                .param("user", userId)
                .param("limit", limit)
                .query((rs, n) -> new NotificationRow(
                        rs.getObject(1, UUID.class),
                        rs.getObject(2, UUID.class),
                        rs.getObject(3, UUID.class),
                        rs.getString(4),
                        rs.getString(5),
                        rs.getString(6),
                        rs.getString(7),
                        rs.getString(8),
                        rs.getString(9),
                        rs.getString(10),
                        rs.getString(11),
                        rs.getObject(12, OffsetDateTime.class),
                        rs.getObject(13, OffsetDateTime.class)))
                .list();
    }

    public int unread(UUID userId) {
        return jdbc.sql("select count(*) from notifications where user_id = :user and read_at is null")
                .param("user", userId)
                .query(Integer.class)
                .single();
    }

    public boolean markRead(UUID userId, UUID id, OffsetDateTime now) {
        return jdbc.sql("update notifications set read_at = coalesce(read_at, :now) where id = :id and user_id = :user")
                        .param("id", id)
                        .param("user", userId)
                        .param("now", now)
                        .update()
                == 1;
    }

    public void markAllRead(UUID userId, OffsetDateTime now) {
        jdbc.sql("update notifications set read_at = :now where user_id = :user and read_at is null")
                .param("user", userId)
                .param("now", now)
                .update();
    }

    /** The person's choices: category to whether email is on. Missing categories use the default. */
    public Map<String, Boolean> preferences(UUID userId) {
        return jdbc
                .sql("select category, email from notification_preferences where user_id = :user")
                .param("user", userId)
                .query((rs, n) -> Map.entry(rs.getString(1), rs.getBoolean(2)))
                .list()
                .stream()
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    public Optional<Boolean> email(UUID userId, String category) {
        return jdbc.sql("select email from notification_preferences where user_id = :user and category = :category")
                .param("user", userId)
                .param("category", category)
                .query(Boolean.class)
                .optional();
    }

    public void savePreference(UUID userId, String category, boolean email, OffsetDateTime now) {
        jdbc.sql("""
                        insert into notification_preferences (user_id, category, email, updated_at)
                        values (:user, :category, :email, :now)
                        on conflict (user_id, category) do update set email = excluded.email,
                            updated_at = excluded.updated_at
                        """)
                .param("user", userId)
                .param("category", category)
                .param("email", email)
                .param("now", now)
                .update();
    }
}
