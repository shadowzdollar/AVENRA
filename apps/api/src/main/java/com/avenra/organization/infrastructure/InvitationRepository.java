package com.avenra.organization.infrastructure;

import com.avenra.organization.domain.Role;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Invitations; tokens are stored as hashes. */
@Repository
public class InvitationRepository {

    public record InvitationRow(
            UUID id,
            UUID organizationId,
            String emailNormalized,
            Role role,
            UUID invitedBy,
            OffsetDateTime createdAt,
            OffsetDateTime expiresAt) {}

    private static final String COLUMNS =
            "id, organization_id, email_normalized, role, invited_by, created_at, expires_at";

    private final JdbcClient jdbc;

    InvitationRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /** Revokes earlier pending invitations for the same address, then stores the new one. */
    public void insert(InvitationRow invitation, byte[] tokenHash, OffsetDateTime now) {
        jdbc.sql("""
                        update invitations set revoked_at = :now
                        where organization_id = :org and email_normalized = :email
                          and accepted_at is null and revoked_at is null
                        """)
                .param("org", invitation.organizationId())
                .param("email", invitation.emailNormalized())
                .param("now", now)
                .update();
        jdbc.sql("""
                        insert into invitations (id, organization_id, email_normalized, role, token_hash, invited_by,
                                                 created_at, expires_at)
                        values (:id, :org, :email, :role, :hash, :by, :created, :expires)
                        """)
                .param("id", invitation.id())
                .param("org", invitation.organizationId())
                .param("email", invitation.emailNormalized())
                .param("role", invitation.role().name())
                .param("hash", tokenHash)
                .param("by", invitation.invitedBy())
                .param("created", invitation.createdAt())
                .param("expires", invitation.expiresAt())
                .update();
    }

    public List<InvitationRow> listPending(UUID organizationId, OffsetDateTime now) {
        return jdbc.sql("select " + COLUMNS + """
                         from invitations
                        where organization_id = :org and accepted_at is null and revoked_at is null and expires_at > :now
                        order by created_at desc
                        """)
                .param("org", organizationId)
                .param("now", now)
                .query(InvitationRow.class)
                .list();
    }

    public boolean revoke(UUID organizationId, UUID invitationId, OffsetDateTime now) {
        return jdbc.sql("""
                                update invitations set revoked_at = :now
                                where organization_id = :org and id = :id and accepted_at is null and revoked_at is null
                                """)
                        .param("org", organizationId)
                        .param("id", invitationId)
                        .param("now", now)
                        .update()
                > 0;
    }

    /**
     * The pending invitation with this token hash, locked. Visible only because the transaction
     * carries the token hash ({@code app.invitation_token_hash}).
     */
    public Optional<InvitationRow> findPendingByTokenForUpdate(byte[] tokenHash, OffsetDateTime now) {
        return jdbc.sql("select " + COLUMNS + """
                         from invitations
                        where token_hash = :hash and accepted_at is null and revoked_at is null and expires_at > :now
                        for update
                        """)
                .param("hash", tokenHash)
                .param("now", now)
                .query(InvitationRow.class)
                .optional();
    }

    public void markAccepted(UUID invitationId, OffsetDateTime now) {
        jdbc.sql("update invitations set accepted_at = :now where id = :id")
                .param("id", invitationId)
                .param("now", now)
                .update();
    }
}
