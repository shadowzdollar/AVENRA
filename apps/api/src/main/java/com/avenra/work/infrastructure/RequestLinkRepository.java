package com.avenra.work.infrastructure;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Request links (ADR-020). Tokens are stored only as hashes. */
@Repository
public class RequestLinkRepository {

    public record LinkRow(
            UUID id,
            UUID organizationId,
            UUID workId,
            String recipientEmail,
            @Nullable String recipientName,
            @Nullable String message,
            UUID createdBy,
            OffsetDateTime createdAt,
            OffsetDateTime expiresAt,
            @Nullable OffsetDateTime revokedAt,
            @Nullable OffsetDateTime lastOpenedAt) {}

    private static final String LINK = "id, organization_id, work_id, recipient_email, recipient_name, message,"
            + " created_by, created_at, expires_at, revoked_at, last_opened_at";

    private final JdbcClient jdbc;

    RequestLinkRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(LinkRow row, byte[] tokenHash, Collection<UUID> requirementIds) {
        jdbc.sql("insert into request_links (" + LINK + ", token_hash) values (:id, :org, :work, :email, :name,"
                        + " :message, :by, :created, :expires, null, null, :hash)")
                .param("id", row.id())
                .param("org", row.organizationId())
                .param("work", row.workId())
                .param("email", row.recipientEmail())
                .param("name", row.recipientName())
                .param("message", row.message())
                .param("by", row.createdBy())
                .param("created", row.createdAt())
                .param("expires", row.expiresAt())
                .param("hash", tokenHash)
                .update();
        for (UUID requirementId : requirementIds) {
            jdbc.sql("""
                            insert into request_link_requirements (request_link_id, requirement_id, organization_id)
                            values (:link, :requirement, :org)
                            """)
                    .param("link", row.id())
                    .param("requirement", requirementId)
                    .param("org", row.organizationId())
                    .update();
        }
    }

    public List<LinkRow> forWork(UUID organizationId, UUID workId) {
        return jdbc.sql("select " + LINK + " from request_links where organization_id = :org and work_id = :work"
                        + " order by created_at desc, id")
                .param("org", organizationId)
                .param("work", workId)
                .query(LinkRow.class)
                .list();
    }

    public Map<UUID, List<UUID>> requirementIds(Collection<UUID> linkIds) {
        if (linkIds.isEmpty()) {
            return Map.of();
        }
        return jdbc
                .sql("""
                        select request_link_id, requirement_id from request_link_requirements
                        where request_link_id in (:links)
                        order by requirement_id
                        """)
                .param("links", linkIds)
                .query((rs, row) -> Map.entry(rs.getObject(1, UUID.class), rs.getObject(2, UUID.class)))
                .list()
                .stream()
                .collect(Collectors.groupingBy(
                        Map.Entry::getKey, Collectors.mapping(Map.Entry::getValue, Collectors.toList())));
    }

    public boolean revoke(UUID organizationId, UUID workId, UUID linkId, OffsetDateTime now) {
        return jdbc.sql("""
                                update request_links set revoked_at = :now
                                where organization_id = :org and work_id = :work and id = :id and revoked_at is null
                                """)
                        .param("org", organizationId)
                        .param("work", workId)
                        .param("id", linkId)
                        .param("now", now)
                        .update()
                > 0;
    }

    public Optional<LinkRow> find(UUID organizationId, UUID workId, UUID linkId) {
        return jdbc.sql("select " + LINK + " from request_links where organization_id = :org and work_id = :work"
                        + " and id = :id")
                .param("org", organizationId)
                .param("work", workId)
                .param("id", linkId)
                .query(LinkRow.class)
                .optional();
    }

    /**
     * The usable link with this token hash. Visible only because the transaction carries the hash
     * ({@code app.request_link_token_hash}, ADR-020).
     */
    public Optional<LinkRow> findUsableByTokenHash(byte[] tokenHash, OffsetDateTime now) {
        return jdbc.sql("select " + LINK + """
                         from request_links
                        where token_hash = :hash and revoked_at is null and expires_at > :now
                        """)
                .param("hash", tokenHash)
                .param("now", now)
                .query(LinkRow.class)
                .optional();
    }

    public void markOpened(UUID linkId, OffsetDateTime now) {
        jdbc.sql("update request_links set last_opened_at = :now where id = :id")
                .param("id", linkId)
                .param("now", now)
                .update();
    }
}
