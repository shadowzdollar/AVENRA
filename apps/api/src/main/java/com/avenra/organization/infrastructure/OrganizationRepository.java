package com.avenra.organization.infrastructure;

import com.avenra.organization.domain.Role;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * Organizations and memberships. Every query relies on row-level security as a second layer: it
 * sees only rows of the transaction's tenant scope (ADR-005).
 */
@Repository
public class OrganizationRepository {

    public record OrganizationRow(UUID id, String name, OffsetDateTime createdAt, int requestLinkDays) {}

    public record MembershipRow(UUID id, UUID organizationId, UUID userId, Role role, OffsetDateTime createdAt) {}

    /** A membership together with its organization, for "my organizations". */
    public record MembershipWithOrganization(UUID membershipId, Role role, OrganizationRow organization) {}

    private final JdbcClient jdbc;

    OrganizationRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void insertOrganization(UUID id, String name, OffsetDateTime now) {
        jdbc.sql("insert into organizations (id, name, created_at, updated_at) values (:id, :name, :now, :now)")
                .param("id", id)
                .param("name", name)
                .param("now", now)
                .update();
    }

    public Optional<OrganizationRow> findOrganization(UUID id) {
        return jdbc.sql("select id, name, created_at, request_link_days from organizations where id = :id")
                .param("id", id)
                .query(OrganizationRow.class)
                .optional();
    }

    public void updateOrganization(UUID id, String name, int requestLinkDays, OffsetDateTime now) {
        jdbc.sql("update organizations set name = :name, request_link_days = :days, updated_at = :now where id = :id")
                .param("id", id)
                .param("name", name)
                .param("days", requestLinkDays)
                .param("now", now)
                .update();
    }

    public void insertMembership(UUID id, UUID organizationId, UUID userId, Role role, OffsetDateTime now) {
        jdbc.sql("""
                        insert into memberships (id, organization_id, user_id, role, created_at, updated_at)
                        values (:id, :org, :user, :role, :now, :now)
                        """)
                .param("id", id)
                .param("org", organizationId)
                .param("user", userId)
                .param("role", role.name())
                .param("now", now)
                .update();
    }

    /** The user's membership in an organization; visible under the user's own scope. */
    public Optional<MembershipRow> findMembership(UUID organizationId, UUID userId) {
        return jdbc.sql("""
                        select id, organization_id, user_id, role, created_at from memberships
                        where organization_id = :org and user_id = :user
                        """)
                .param("org", organizationId)
                .param("user", userId)
                .query(MembershipRow.class)
                .optional();
    }

    public boolean membershipExists(UUID organizationId, UUID membershipId) {
        return jdbc.sql("select count(*) from memberships where organization_id = :org and id = :id")
                        .param("org", organizationId)
                        .param("id", membershipId)
                        .query(Long.class)
                        .single()
                > 0;
    }

    public Optional<MembershipRow> findMembershipForUpdate(UUID organizationId, UUID membershipId) {
        return jdbc.sql("""
                        select id, organization_id, user_id, role, created_at from memberships
                        where organization_id = :org and id = :id for update
                        """)
                .param("org", organizationId)
                .param("id", membershipId)
                .query(MembershipRow.class)
                .optional();
    }

    public List<MembershipRow> listMembers(UUID organizationId) {
        return jdbc.sql("""
                        select id, organization_id, user_id, role, created_at from memberships
                        where organization_id = :org order by created_at
                        """)
                .param("org", organizationId)
                .query(MembershipRow.class)
                .list();
    }

    /** Owners of an organization, locked so the last-owner rule holds under concurrency. */
    public long countOwnersForUpdate(UUID organizationId) {
        return jdbc.sql("select id from memberships where organization_id = :org and role = 'OWNER' for update")
                .param("org", organizationId)
                .query(UUID.class)
                .list()
                .size();
    }

    public void changeRole(UUID membershipId, Role role, OffsetDateTime now) {
        jdbc.sql("update memberships set role = :role, updated_at = :now where id = :id")
                .param("id", membershipId)
                .param("role", role.name())
                .param("now", now)
                .update();
    }

    public void deleteMembership(UUID membershipId) {
        jdbc.sql("delete from memberships where id = :id")
                .param("id", membershipId)
                .update();
    }

    public List<MembershipWithOrganization> membershipsOf(UUID userId) {
        return jdbc.sql("""
                        select m.id as membership_id, m.role, o.id, o.name, o.created_at, o.request_link_days
                        from memberships m join organizations o on o.id = m.organization_id
                        where m.user_id = :user order by o.name
                        """)
                .param("user", userId)
                .query((rs, row) -> new MembershipWithOrganization(
                        rs.getObject("membership_id", UUID.class),
                        Role.valueOf(rs.getString("role")),
                        new OrganizationRow(
                                rs.getObject("id", UUID.class),
                                rs.getString("name"),
                                rs.getObject("created_at", OffsetDateTime.class),
                                rs.getInt("request_link_days"))))
                .list();
    }
}
