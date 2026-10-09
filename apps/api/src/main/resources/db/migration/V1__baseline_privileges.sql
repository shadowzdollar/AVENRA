-- Baseline privileges for the runtime application role (ADR-002, ADR-005).
-- Runs as the owner role. The application role may read and write data in
-- tables the owner creates, but cannot create, alter or drop objects.

GRANT USAGE ON SCHEMA public TO ${app_role};

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${app_role};

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO ${app_role};

-- Flyway's own history table is not application data.
REVOKE ALL ON TABLE flyway_schema_history FROM ${app_role};
