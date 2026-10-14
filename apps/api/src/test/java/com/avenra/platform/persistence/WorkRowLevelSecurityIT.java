package com.avenra.platform.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.avenra.IntegrationTest;
import com.avenra.IntegrationTestBase;
import com.avenra.PostgresTestDatabase;
import java.security.SecureRandom;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Database-level isolation of the Phase 3 tables (ADR-005, ADR-020; Phase 3 criteria 3.3, 3.7,
 * 3.10), run as the runtime role with nothing but the transaction-scoped settings: tenants cannot
 * see or change each other's rows, a request-link holder sees only its link's requirements, and
 * history (items, versions, transitions) cannot be rewritten.
 */
@IntegrationTest
class WorkRowLevelSecurityIT extends IntegrationTestBase {

    private static final String INSUFFICIENT_PRIVILEGE = "42501";
    private static final String FOREIGN_KEY_VIOLATION = "23503";

    /** Every tenant-owned table added in Phase 3. */
    private static final List<String> TABLES = List.of(
            "clients",
            "projects",
            "work",
            "work_transitions",
            "tasks",
            "requirements",
            "documents",
            "document_versions",
            "information_items",
            "request_links",
            "request_link_requirements");

    private final JdbcTemplate jdbc;
    private final TransactionTemplate tx;

    private final UUID userA = UUID.randomUUID();
    private final UUID userB = UUID.randomUUID();
    private final UUID orgA = UUID.randomUUID();
    private final UUID orgB = UUID.randomUUID();
    private final UUID clientB = UUID.randomUUID();
    private final UUID workA = UUID.randomUUID();
    private final UUID linkedRequirementA = UUID.randomUUID();
    private final UUID otherRequirementA = UUID.randomUUID();
    private final UUID linkA = UUID.randomUUID();
    private final UUID itemA = UUID.randomUUID();
    private final UUID documentA = UUID.randomUUID();
    private final byte[] activeToken = randomBytes();
    private final byte[] expiredToken = randomBytes();
    private final byte[] revokedToken = randomBytes();

    @Autowired
    WorkRowLevelSecurityIT(JdbcTemplate jdbc, TransactionTemplate tx) {
        this.jdbc = jdbc;
        this.tx = tx;
    }

    /** Seeds one full set of rows in each of two tenants, as the schema owner (not subject to RLS). */
    @BeforeEach
    void seed() throws SQLException {
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
            seedTenant(owner, orgA, userA, UUID.randomUUID(), workA, linkedRequirementA, itemA, documentA);
            seedTenant(
                    owner,
                    orgB,
                    userB,
                    clientB,
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    UUID.randomUUID());
            exec(
                    owner,
                    "insert into requirements (id, organization_id, work_id, title, kind, required, created_by,"
                            + " created_at, updated_at) values ('" + otherRequirementA + "', '" + orgA + "', '" + workA
                            + "', 'Other', 'TEXT', true, '" + userA + "', now(), now())");
            exec(
                    owner,
                    "insert into information_items (id, organization_id, requirement_id, kind, value_text,"
                            + " source_type, source_user_id, received_at, verification_state) values ('"
                            + UUID.randomUUID()
                            + "', '" + orgA + "', '" + otherRequirementA + "', 'TEXT', 'hidden', 'TEAM_MEMBER', '"
                            + userA
                            + "', now(), 'PENDING')");
            insertLink(owner, linkA, activeToken, "now() + interval '1 day'", "null");
            insertLink(owner, UUID.randomUUID(), expiredToken, "now() + interval '1 second'", "null");
            exec(
                    owner,
                    "update request_links set created_at = now() - interval '2 days', expires_at = now() -"
                            + " interval '1 day' where token_hash = decode('" + hex(expiredToken) + "', 'hex')");
            insertLink(owner, UUID.randomUUID(), revokedToken, "now() + interval '1 day'", "now()");
        }
    }

    private void seedTenant(
            Connection owner, UUID org, UUID user, UUID client, UUID work, UUID requirement, UUID item, UUID document)
            throws SQLException {
        UUID membership = UUID.randomUUID();
        exec(
                owner,
                "insert into memberships values ('" + membership + "', '" + org + "', '" + user
                        + "', 'OWNER', now(), now())");
        exec(
                owner,
                "insert into clients (id, organization_id, name, created_by, created_at, updated_at) values ('" + client
                        + "', '" + org + "', 'Client', '" + user + "', now(), now())");
        UUID project = UUID.randomUUID();
        exec(
                owner,
                "insert into projects (id, organization_id, client_id, name, created_by, created_at, updated_at)"
                        + " values ('" + project + "', '" + org + "', '" + client + "', 'Project', '" + user
                        + "', now(), now())");
        exec(
                owner,
                "insert into work (id, organization_id, client_id, project_id, title, priority, status,"
                        + " owner_membership_id, requested_by, created_at, updated_at) values ('" + work + "', '" + org
                        + "', '"
                        + client + "', '" + project + "', 'Work', 'NORMAL', 'RUNNING', '" + membership + "', '" + user
                        + "', now(), now())");
        exec(
                owner,
                "insert into work_transitions (id, organization_id, work_id, to_status, actor_user_id,"
                        + " occurred_at) values ('" + UUID.randomUUID() + "', '" + org + "', '" + work + "', 'DRAFT', '"
                        + user
                        + "', now())");
        exec(
                owner,
                "insert into tasks (id, organization_id, work_id, title, kind, completion_condition, status,"
                        + " created_by, created_at, updated_at) values ('" + UUID.randomUUID() + "', '" + org + "', '"
                        + work
                        + "', 'Task', 'HUMAN', 'Done when done', 'OPEN', '" + user + "', now(), now())");
        exec(
                owner,
                "insert into requirements (id, organization_id, work_id, title, kind, required, created_by,"
                        + " created_at, updated_at) values ('" + requirement + "', '" + org + "', '" + work
                        + "', 'Tax return', 'DOCUMENT', true, '" + user + "', now(), now())");
        exec(
                owner,
                "insert into documents (id, organization_id, requirement_id, created_at) values ('" + document + "', '"
                        + org + "', '" + requirement + "', now())");
        exec(
                owner,
                "insert into document_versions (document_id, version, organization_id, file_name, content_type,"
                        + " size_bytes, sha256, storage_key, scan_status, uploaded_by_user_id, uploaded_at) values ('"
                        + document + "', 1, '" + org + "', 'a.pdf', 'application/pdf', 10, decode('" + hex(new byte[32])
                        + "', 'hex'), 'org/" + org + "/documents/" + document + "/v1', 'CLEAN', '" + user
                        + "', now())");
        exec(
                owner,
                "insert into information_items (id, organization_id, requirement_id, kind, document_id,"
                        + " document_version, source_type, source_user_id, received_at, verification_state) values ('"
                        + item
                        + "', '" + org + "', '" + requirement + "', 'DOCUMENT', '" + document + "', 1, 'TEAM_MEMBER', '"
                        + user + "', now(), 'PENDING')");
        exec(owner, "update requirements set current_item_id = '" + item + "' where id = '" + requirement + "'");
    }

    private void insertLink(Connection owner, UUID id, byte[] token, String expires, String revoked)
            throws SQLException {
        exec(
                owner,
                "insert into request_links (id, organization_id, work_id, token_hash, recipient_email,"
                        + " created_by, created_at, expires_at, revoked_at) values ('" + id + "', '" + orgA + "', '"
                        + workA
                        + "', decode('" + hex(token) + "', 'hex'), 'client@t.test', '" + userA + "', now(), " + expires
                        + ", "
                        + revoked + ")");
        exec(
                owner,
                "insert into request_link_requirements values ('" + id + "', '" + linkedRequirementA + "', '" + orgA
                        + "')");
    }

    @Test
    void withoutContextNoPhase3RowIsVisible() {
        as(
                null,
                null,
                db -> TABLES.forEach(
                        table -> assertThat(count(db, table)).as(table).isZero()));
    }

    @Test
    void eachTenantSeesOnlyItsOwnRowsInEveryTable() {
        as(
                userA,
                orgA,
                db -> TABLES.forEach(table -> {
                    assertThat(count(db, table)).as(table).isPositive();
                    assertThat(db.queryForObject(
                                    "select count(*) from " + table + " where organization_id <> ?", Long.class, orgA))
                            .as(table + " of other tenants")
                            .isZero();
                }));
    }

    @Test
    void aTenantCannotChangeOrAddAnotherTenantsRows() {
        as(userA, orgA, db -> {
            assertThat(db.update("update clients set name = 'x' where organization_id = ?", orgB))
                    .isZero();
            assertThat(db.update("update work set title = 'x' where organization_id = ?", orgB))
                    .isZero();
            assertThat(db.update("update requirements set title = 'x' where organization_id = ?", orgB))
                    .isZero();
            assertThat(db.update("update request_links set revoked_at = now() where organization_id = ?", orgB))
                    .isZero();
        });
        assertThatThrownBy(() -> as(
                        userA,
                        orgA,
                        db -> db.update(
                                "insert into clients (id, organization_id, name, created_by, created_at, updated_at)"
                                        + " values (?, ?, 'x', ?, now(), now())",
                                UUID.randomUUID(),
                                orgB,
                                userA)))
                .satisfies(WorkRowLevelSecurityIT::isInsufficientPrivilege);
    }

    @Test
    void rowsCannotReferenceAnotherTenantsRows() {
        // Composite (organization_id, id) references: a project of A pointing at a client of B fails.
        assertThatThrownBy(() -> as(
                        userA,
                        orgA,
                        db -> db.update(
                                "insert into projects (id, organization_id, client_id, name, created_by, created_at,"
                                        + " updated_at) values (?, ?, ?, 'x', ?, now(), now())",
                                UUID.randomUUID(),
                                orgA,
                                clientB,
                                userA)))
                .satisfies(error -> assertThat(sqlState(error)).isEqualTo(FOREIGN_KEY_VIOLATION));
    }

    @Test
    void historyCannotBeRewritten() {
        assertDenied("update information_items set value_text = 'changed' where id = '" + itemA + "'");
        assertDenied("update information_items set source_user_id = null where id = '" + itemA + "'");
        assertDenied("delete from information_items where id = '" + itemA + "'");
        assertDenied("update document_versions set storage_key = 'org/x' where document_id = '" + documentA + "'");
        assertDenied("delete from document_versions where document_id = '" + documentA + "'");
        assertDenied("update work_transitions set to_status = 'COMPLETED'");
        assertDenied("delete from work where id = '" + workA + "'");
        assertDenied("delete from requirements where id = '" + linkedRequirementA + "'");
        // Only the review columns of an item can change.
        as(
                userA,
                orgA,
                db -> assertThat(db.update(
                                "update information_items set verification_state = 'ACCEPTED', reviewed_by = ?,"
                                        + " reviewed_at = now() where id = ?",
                                userA,
                                itemA))
                        .isEqualTo(1));
    }

    @Test
    void aRequestLinkExposesOnlyItsOwnRequirements() {
        asLink(activeToken, db -> {
            assertThat(db.queryForList("select id from request_links", UUID.class))
                    .containsExactly(linkA);
            assertThat(db.queryForList("select id from requirements", UUID.class))
                    .containsExactly(linkedRequirementA);
            assertThat(db.queryForList("select id from information_items", UUID.class))
                    .containsExactly(itemA);
            assertThat(db.queryForList("select id from work", UUID.class)).containsExactly(workA);
            assertThat(db.queryForList("select id from organizations", UUID.class))
                    .containsExactly(orgA);
            assertThat(count(db, "clients")).isZero();
            assertThat(count(db, "projects")).isZero();
            assertThat(count(db, "tasks")).isZero();
            assertThat(count(db, "work_transitions")).isZero();
            assertThat(count(db, "memberships")).isZero();
            assertThat(db.update("update work set title = 'x'")).isZero();
            assertThat(db.update("update requirements set title = 'x' where id = ?", otherRequirementA))
                    .isZero();
        });
    }

    @Test
    void expiredAndRevokedLinksExposeNothing() {
        for (byte[] token : List.of(expiredToken, revokedToken, randomBytes())) {
            asLink(token, db -> {
                assertThat(count(db, "requirements")).isZero();
                assertThat(count(db, "information_items")).isZero();
                assertThat(count(db, "work")).isZero();
                assertThat(count(db, "organizations")).isZero();
            });
        }
    }

    @Test
    void aRequestLinkCanOnlyAddItemsForItsRequirementsInItsOwnName() {
        String insert = "insert into information_items (id, organization_id, requirement_id, kind, value_text,"
                + " source_type, source_link_id, received_at, verification_state) values (?, ?, ?, 'TEXT', 'v',"
                + " 'CLIENT_LINK', ?, now(), 'PENDING')";
        asLink(
                activeToken,
                db -> assertThat(db.update(insert, UUID.randomUUID(), orgA, linkedRequirementA, linkA))
                        .isEqualTo(1));
        assertThatThrownBy(() ->
                        asLink(activeToken, db -> db.update(insert, UUID.randomUUID(), orgA, otherRequirementA, linkA)))
                .satisfies(WorkRowLevelSecurityIT::isInsufficientPrivilege);
        assertThatThrownBy(() -> asLink(
                        revokedToken, db -> db.update(insert, UUID.randomUUID(), orgA, linkedRequirementA, linkA)))
                .satisfies(WorkRowLevelSecurityIT::isInsufficientPrivilege);
    }

    private void assertDenied(String sql) {
        assertThatThrownBy(() -> as(userA, orgA, db -> db.update(sql)))
                .as(sql)
                .satisfies(WorkRowLevelSecurityIT::isInsufficientPrivilege);
    }

    private void as(UUID user, UUID organization, Consumer<JdbcTemplate> work) {
        tx.executeWithoutResult(status -> {
            jdbc.queryForObject("select set_config('app.user_id', ?, true)", String.class, string(user));
            jdbc.queryForObject(
                    "select set_config('app.organization_id', ?, true)", String.class, string(organization));
            work.accept(jdbc);
        });
    }

    private void asLink(byte[] tokenHash, Consumer<JdbcTemplate> work) {
        tx.executeWithoutResult(status -> {
            jdbc.queryForObject(
                    "select set_config('app.request_link_token_hash', ?, true)", String.class, hex(tokenHash));
            work.accept(jdbc);
        });
    }

    private static long count(JdbcTemplate db, String table) {
        return db.queryForObject("select count(*) from " + table, Long.class);
    }

    private static void isInsufficientPrivilege(Throwable error) {
        assertThat(sqlState(error)).isEqualTo(INSUFFICIENT_PRIVILEGE);
    }

    private static String sqlState(Throwable error) {
        for (Throwable cause = error; cause != null; cause = cause.getCause()) {
            if (cause instanceof SQLException sql) {
                return sql.getSQLState();
            }
        }
        return null;
    }

    private static void exec(Connection connection, String sql) throws SQLException {
        try (var statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }

    private static String string(UUID id) {
        return id == null ? "" : id.toString();
    }

    private static String hex(byte[] bytes) {
        return HexFormat.of().formatHex(bytes);
    }

    private static byte[] randomBytes() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return bytes;
    }
}
