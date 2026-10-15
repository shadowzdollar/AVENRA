package com.avenra.information.infrastructure;

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
            @Nullable OffsetDateTime lastOpenedAt,
            int remindersSent,
            @Nullable OffsetDateTime lastRemindedAt,
            @Nullable OffsetDateTime expiryHandledAt) {}

    /** The encrypted copy of a link token (ADR-025). */
    public record SealedToken(String keyId, byte[] ciphertext) {}

    private static final String LINK = "id, organization_id, work_id, recipient_email, recipient_name, message,"
            + " created_by, created_at, expires_at, revoked_at, last_opened_at, reminders_sent, last_reminded_at,"
            + " expiry_handled_at";

    private final JdbcClient jdbc;

    RequestLinkRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(LinkRow row, byte[] tokenHash, SealedToken sealed, Collection<UUID> requirementIds) {
        jdbc.sql("insert into request_links (" + LINK + ", token_hash, token_key_id, token_ciphertext) values (:id,"
                        + " :org, :work, :email, :name, :message, :by, :created, :expires, null, null, 0, null, null,"
                        + " :hash, :keyId, :sealed)")
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
                .param("keyId", sealed.keyId())
                .param("sealed", sealed.ciphertext())
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
                                update request_links set revoked_at = :now, token_key_id = null, token_ciphertext = null
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

    /** The link with its encrypted token, locked; only inside the link's organization. */
    public Optional<LinkRow> findForUpdate(UUID organizationId, UUID linkId) {
        return jdbc.sql("select " + LINK + " from request_links where organization_id = :org and id = :id for update")
                .param("org", organizationId)
                .param("id", linkId)
                .query(LinkRow.class)
                .optional();
    }

    public Optional<SealedToken> sealedToken(UUID linkId) {
        return jdbc.sql("select token_key_id, token_ciphertext from request_links where id = :id"
                        + " and token_ciphertext is not null")
                .param("id", linkId)
                .query((rs, row) -> new SealedToken(rs.getString(1), rs.getBytes(2)))
                .optional();
    }

    public void recordReminder(UUID linkId, int number, OffsetDateTime now) {
        jdbc.sql("update request_links set reminders_sent = :number, last_reminded_at = :now where id = :id")
                .param("id", linkId)
                .param("number", number)
                .param("now", now)
                .update();
    }

    /** An expired link: its token copy is erased and it is not handled again. */
    public void markExpiryHandled(UUID linkId, OffsetDateTime now) {
        jdbc.sql("""
                        update request_links set expiry_handled_at = :now, token_key_id = null, token_ciphertext = null
                        where id = :id
                        """).param("id", linkId).param("now", now).update();
    }

    /** Active links of work that cover a requirement (to decide automatic transitions). */
    public long activeLinksCovering(UUID organizationId, UUID requirementId, OffsetDateTime now) {
        return jdbc.sql("""
                        select count(*) from request_links l
                        join request_link_requirements r on r.request_link_id = l.id
                        where l.organization_id = :org and r.requirement_id = :requirement
                          and l.revoked_at is null and l.expires_at > :now
                        """)
                .param("org", organizationId)
                .param("requirement", requirementId)
                .param("now", now)
                .query(Long.class)
                .single();
    }

    public void markOpened(UUID linkId, OffsetDateTime now) {
        jdbc.sql("update request_links set last_opened_at = :now where id = :id")
                .param("id", linkId)
                .param("now", now)
                .update();
    }
}
