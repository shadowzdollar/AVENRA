#!/usr/bin/env bash
# Creates the Avenra database and its two roles on first container start.
#   owner: owns the schema, runs Flyway migrations.
#   app:   runtime role; not owner, not superuser, cannot bypass RLS (ADR-005).
# Table privileges for the app role are granted by Flyway migrations.
set -euo pipefail

psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" --dbname postgres \
  -v owner_user="$AVENRA_DB_OWNER_USER" \
  -v owner_password="$AVENRA_DB_OWNER_PASSWORD" \
  -v app_user="$AVENRA_DB_APP_USER" \
  -v app_password="$AVENRA_DB_APP_PASSWORD" \
  -v db_name="$AVENRA_DB_NAME" <<'SQL'
CREATE ROLE :"owner_user" LOGIN PASSWORD :'owner_password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
CREATE ROLE :"app_user" LOGIN PASSWORD :'app_password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;

CREATE DATABASE :"db_name" OWNER :"owner_user";
REVOKE ALL ON DATABASE :"db_name" FROM PUBLIC;
GRANT CONNECT ON DATABASE :"db_name" TO :"app_user";
SQL

psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" --dbname "$AVENRA_DB_NAME" \
  -v owner_user="$AVENRA_DB_OWNER_USER" <<'SQL'
-- Only the owner may create objects in the public schema.
REVOKE ALL ON SCHEMA public FROM PUBLIC;
ALTER SCHEMA public OWNER TO :"owner_user";
SQL
