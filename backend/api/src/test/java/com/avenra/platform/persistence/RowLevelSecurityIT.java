package com.avenra.platform.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.avenra.IntegrationTest;
import com.avenra.IntegrationTestBase;
import com.avenra.PostgresTestDatabase;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.HexFormat;
import java.util.UUID;
import java.util.function.Consumer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Proves the database-level tenant isolation (ADR-005, Guidelines §137, Phase 2 criteria 2.10 and
 * 2.11) without the application layer: queries run as the runtime role with only the
 * transaction-scoped tenant settings, exactly as a buggy query in application code would.
 */
@IntegrationTest
class RowLevelSecurityIT extends IntegrationTestBase {

    private static final String INSUFFICIENT_PRIVILEGE = "42501";

    private final JdbcTemplate jdbc;
    private final TransactionTemplate tx;

    private final UUID userA = UUID.randomUUID();
    private final UUID userB = UUID.randomUUID();
    private final UUID orgA = UUID.randomUUID();
    private final UUID orgB = UUID.randomUUID();
    private final byte[] invitationTokenHashB = randomBytes();

    @Autowired
    RowLevelSecurityIT(JdbcTemplate jdbc, TransactionTemplate tx) {
        this.jdbc = jdbc;
        this.tx = tx;
    }

    /** Seeds two tenants as the schema owner, which is not subject to row-level security. */
    @BeforeEach
    void seedTwoTenants() throws SQLException {
        try (Connection owner = DriverManager.getConnection(
                PostgresTestDatabase.jdbcUrl(), PostgresTestDatabase.OWNER_USER, PostgresTestDatabase.OWNER_PASSWORD)) {
            for (UUID user : new UUID[] {userA, userB}) {
                exec(
                        owner,
                        "insert into users (id, email, email_normalized, display_name, password_hash, created_at,"
                                + " updated_at) values ('" + user + "', '" + user + "@t.test', '" + user
                                + "@t.test', 'U', 'x', now(), now())");
            }
            exec(
                    owner,
                    "insert into organizations values ('" + orgA + "', 'A', now(), now()), ('" + orgB
                            + "', 'B', now(), now())");
            exec(
                    owner,
                    "insert into memberships values ('" + UUID.randomUUID() + "', '" + orgA + "', '" + userA
                            + "', 'OWNER', now(), now()), ('" + UUID.randomUUID() + "', '" + orgB + "', '" + userB
                            + "', 'OWNER', now(), now())");
            exec(
                    owner,
                    "insert into invitations (id, organization_id, email_normalized, role, token_hash, invited_by,"
                            + " created_at, expires_at) values ('" + UUID.randomUUID() + "', '" + orgB
                            + "', 'x@t.test',"
                            + " 'MEMBER', decode('" + HexFormat.of().formatHex(invitationTokenHashB) + "', 'hex'), '"
                            + userB + "', now(), now() + interval '1 day')");
        }
    }

    private void as(UUID user, UUID organization, Consumer<JdbcTemplate> work) {
        tx.executeWithoutResult(status -> {
            jdbc.queryForObject("select set_config('app.user_id', ?, true)", String.class, string(user));
            jdbc.queryForObject(
                    "select set_config('app.organization_id', ?, true)", String.class, string(organization));
            work.accept(jdbc);
        });
    }

    @Test
    void withoutTenantContextNothingIsVisible() {
        as(null, null, db -> {
            assertThat(count(db, "organizations")).isZero();
            assertThat(count(db, "memberships")).isZero();
            assertThat(count(db, "invitations")).isZero();
        });
    }

    @Test
    void aUserSeesOnlyTheirOwnOrganizationsAndMemberships() {
        as(userA, null, db -> {
            assertThat(db.queryForList("select id from organizations", UUID.class))
                    .containsExactly(orgA);
            assertThat(db.queryForList("select organization_id from memberships", UUID.class))
                    .containsExactly(orgA);
        });
    }

    @Test
    void tenantACannotReadTenantBEvenByIdentifier() {
        as(userA, orgA, db -> {
            assertThat(db.queryForObject("select count(*) from organizations where id = ?", Long.class, orgB))
                    .isZero();
            assertThat(db.queryForObject(
                            "select count(*) from memberships where organization_id = ?", Long.class, orgB))
                    .isZero();
            assertThat(count(db, "invitations")).isZero();
        });
    }

    @Test
    void tenantACannotModifyTenantB() {
        as(userA, orgA, db -> {
            assertThat(db.update("update organizations set name = 'hijacked' where id = ?", orgB))
                    .isZero();
            assertThat(db.update("update memberships set role = 'VIEWER' where organization_id = ?", orgB))
                    .isZero();
            assertThat(db.update("delete from memberships where organization_id = ?", orgB))
                    .isZero();
        });
        assertThatThrownBy(() -> as(
                        userA,
                        orgA,
                        db -> db.update(
                                "insert into memberships values (?, ?, ?, 'OWNER', now(), now())",
                                UUID.randomUUID(),
                                orgB,
                                userA)))
                .satisfies(RowLevelSecurityIT::isInsufficientPrivilege);
    }

    @Test
    void aMembershipInOneOrganizationGrantsNoWriteAccessToItFromAnother() {
        // userA acts in orgB (a context the application would never set without a membership).
        as(
                userA,
                orgB,
                db -> assertThat(db.update("update organizations set name = 'x' where id = ?", orgA))
                        .isZero());
    }

    @Test
    void anInvitationIsVisibleToItsTokenHolderOnly() {
        tx.executeWithoutResult(status -> {
            jdbc.queryForObject("select set_config('app.user_id', ?, true)", String.class, userA.toString());
            jdbc.queryForObject(
                    "select set_config('app.invitation_token_hash', ?, true)",
                    String.class,
                    HexFormat.of().formatHex(invitationTokenHashB));
            assertThat(count(jdbc, "invitations")).isEqualTo(1);
        });
        tx.executeWithoutResult(status -> {
            jdbc.queryForObject(
                    "select set_config('app.invitation_token_hash', ?, true)",
                    String.class,
                    HexFormat.of().formatHex(randomBytes()));
            assertThat(count(jdbc, "invitations")).isZero();
        });
    }

    @Test
    void auditEventsAreAppendOnlyAndTenantScoped() {
        UUID event = UUID.randomUUID();
        as(
                userA,
                orgA,
                db -> db.update(
                        "insert into audit_events (id, occurred_at, organization_id, actor_user_id, action)"
                                + " values (?, now(), ?, ?, 'test.event')",
                        event,
                        orgA,
                        userA));
        as(
                userB,
                orgB,
                db -> assertThat(db.queryForObject("select count(*) from audit_events where id = ?", Long.class, event))
                        .isZero());
        assertThatThrownBy(() ->
                        as(userA, orgA, db -> db.update("update audit_events set action = 'x' where id = ?", event)))
                .satisfies(RowLevelSecurityIT::isInsufficientPrivilege);
        assertThatThrownBy(() -> as(userA, orgA, db -> db.update("delete from audit_events where id = ?", event)))
                .satisfies(RowLevelSecurityIT::isInsufficientPrivilege);
        assertThatThrownBy(() -> as(
                        userA,
                        orgA,
                        db -> db.update(
                                "insert into audit_events (id, occurred_at, organization_id, action) values (?, now(), ?, 'x')",
                                UUID.randomUUID(),
                                orgB)))
                .satisfies(RowLevelSecurityIT::isInsufficientPrivilege);
    }

    private static long count(JdbcTemplate db, String table) {
        return db.queryForObject("select count(*) from " + table, Long.class);
    }

    private static String string(UUID id) {
        return id == null ? "" : id.toString();
    }

    private static void exec(Connection connection, String sql) throws SQLException {
        try (var statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }

    private static byte[] randomBytes() {
        byte[] bytes = new byte[32];
        new java.security.SecureRandom().nextBytes(bytes);
        return bytes;
    }

    private static void isInsufficientPrivilege(Throwable thrown) {
        assertThat(thrown)
                .rootCause()
                .isInstanceOfSatisfying(
                        SQLException.class,
                        cause -> assertThat(cause.getSQLState()).isEqualTo(INSUFFICIENT_PRIVILEGE));
    }
}
