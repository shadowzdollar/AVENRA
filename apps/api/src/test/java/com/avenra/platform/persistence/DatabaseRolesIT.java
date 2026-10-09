package com.avenra.platform.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.avenra.IntegrationTest;
import com.avenra.IntegrationTestBase;
import com.avenra.PostgresTestDatabase;
import java.sql.DriverManager;
import java.sql.SQLException;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Proves the database security baseline (ADR-002, ADR-005): migrations run as the owner, the
 * application runs as a separate role that cannot change the schema or bypass row-level security.
 */
@IntegrationTest
class DatabaseRolesIT extends IntegrationTestBase {

    private final JdbcTemplate jdbc;
    private final Flyway flyway;

    @Autowired
    DatabaseRolesIT(JdbcTemplate jdbc, Flyway flyway) {
        this.jdbc = jdbc;
        this.flyway = flyway;
    }

    @Test
    void migrationsAreAppliedAndValid() {
        assertThat(flyway.info().applied()).isNotEmpty();
        assertThat(flyway.info().pending()).isEmpty();
        flyway.validate();
    }

    @Test
    void applicationConnectsAsTheRuntimeRole() {
        assertThat(jdbc.queryForObject("select current_user", String.class)).isEqualTo(PostgresTestDatabase.APP_USER);
    }

    @Test
    void runtimeRoleIsNotPrivileged() {
        var role = jdbc.queryForMap(
                "select rolsuper, rolbypassrls, rolcreatedb, rolcreaterole from pg_roles where rolname = current_user");

        assertThat(role).containsEntry("rolsuper", false);
        assertThat(role).containsEntry("rolbypassrls", false);
        assertThat(role).containsEntry("rolcreatedb", false);
        assertThat(role).containsEntry("rolcreaterole", false);
    }

    @Test
    void runtimeRoleCannotChangeTheSchema() {
        assertThatThrownBy(() -> jdbc.execute("create table public.not_allowed (id int)"))
                .satisfies(DatabaseRolesIT::isInsufficientPrivilege);
    }

    @Test
    void runtimeRoleCannotReadMigrationHistory() {
        assertThatThrownBy(() -> jdbc.queryForObject("select count(*) from flyway_schema_history", Long.class))
                .satisfies(DatabaseRolesIT::isInsufficientPrivilege);
    }

    @Test
    void runtimeRoleCanUseTablesCreatedByTheOwner() throws SQLException {
        try (var owner = DriverManager.getConnection(
                        PostgresTestDatabase.jdbcUrl(),
                        PostgresTestDatabase.OWNER_USER,
                        PostgresTestDatabase.OWNER_PASSWORD);
                var statement = owner.createStatement()) {
            statement.execute("create table public.privilege_probe (id int)");
        }
        try {
            jdbc.update("insert into public.privilege_probe (id) values (1)");
            assertThat(jdbc.queryForObject("select count(*) from public.privilege_probe", Long.class))
                    .isEqualTo(1L);
            assertThatThrownBy(() -> jdbc.execute("drop table public.privilege_probe"))
                    .satisfies(DatabaseRolesIT::isInsufficientPrivilege);
        } finally {
            try (var owner = DriverManager.getConnection(
                            PostgresTestDatabase.jdbcUrl(),
                            PostgresTestDatabase.OWNER_USER,
                            PostgresTestDatabase.OWNER_PASSWORD);
                    var statement = owner.createStatement()) {
                statement.execute("drop table public.privilege_probe");
            }
        }
    }

    @Test
    void sessionsUseUtc() {
        assertThat(jdbc.queryForObject("show timezone", String.class)).isEqualTo("UTC");
    }

    /** PostgreSQL SQLSTATE 42501: insufficient_privilege. */
    private static final String INSUFFICIENT_PRIVILEGE = "42501";

    private static void isInsufficientPrivilege(Throwable thrown) {
        assertThat(thrown)
                .rootCause()
                .isInstanceOfSatisfying(
                        SQLException.class,
                        cause -> assertThat(cause.getSQLState()).isEqualTo(INSUFFICIENT_PRIVILEGE));
    }
}
