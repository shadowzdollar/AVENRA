-- Identity (Phase 2): users, credentials, sessions, single-use tokens and MFA.
-- Users are not tenant-owned: one person can belong to several organizations
-- through memberships (Guidelines §17). Every secret is stored only as a hash
-- or, for the TOTP secret, encrypted by the application (ADR-013, ADR-017).

CREATE TABLE users (
    id                  uuid        PRIMARY KEY,
    email               text        NOT NULL,
    email_normalized    text        NOT NULL,
    display_name        text        NOT NULL,
    password_hash       text        NOT NULL,
    email_verified_at   timestamptz,
    totp_secret_ciphertext bytea,
    totp_key_id         text,
    totp_enabled_at     timestamptz,
    totp_last_used_step bigint,
    created_at          timestamptz NOT NULL,
    updated_at          timestamptz NOT NULL,
    CONSTRAINT users_email_normalized_unique UNIQUE (email_normalized),
    CONSTRAINT users_display_name_length CHECK (char_length(display_name) BETWEEN 1 AND 100),
    CONSTRAINT users_totp_complete CHECK (
        (totp_enabled_at IS NULL) OR (totp_secret_ciphertext IS NOT NULL AND totp_key_id IS NOT NULL))
);

-- Server-side sessions (ADR-013). Only the SHA-256 hash of the cookie token is stored.
CREATE TABLE sessions (
    id                  uuid        PRIMARY KEY,
    user_id             uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash          bytea       NOT NULL,
    created_at          timestamptz NOT NULL,
    last_seen_at        timestamptz NOT NULL,
    idle_expires_at     timestamptz NOT NULL,
    absolute_expires_at timestamptz NOT NULL,
    revoked_at          timestamptz,
    user_agent          text,
    CONSTRAINT sessions_token_hash_unique UNIQUE (token_hash),
    CONSTRAINT sessions_user_agent_length CHECK (char_length(user_agent) <= 300)
);
CREATE INDEX sessions_user_active_idx ON sessions (user_id) WHERE revoked_at IS NULL;

-- Single-use tokens sent by email (verification, password reset).
CREATE TABLE auth_tokens (
    id          uuid        PRIMARY KEY,
    user_id     uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    purpose     text        NOT NULL,
    token_hash  bytea       NOT NULL,
    created_at  timestamptz NOT NULL,
    expires_at  timestamptz NOT NULL,
    used_at     timestamptz,
    CONSTRAINT auth_tokens_purpose_valid CHECK (purpose IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET')),
    CONSTRAINT auth_tokens_token_hash_unique UNIQUE (token_hash)
);
CREATE INDEX auth_tokens_user_purpose_idx ON auth_tokens (user_id, purpose) WHERE used_at IS NULL;

-- Second step of sign-in when TOTP is enabled (ADR-017).
CREATE TABLE mfa_challenges (
    id          uuid        PRIMARY KEY,
    user_id     uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL,
    expires_at  timestamptz NOT NULL,
    completed_at timestamptz,
    failed_attempts integer NOT NULL DEFAULT 0,
    user_agent  text
);

-- Recovery codes for TOTP, single-use and stored hashed.
CREATE TABLE recovery_codes (
    id          uuid        PRIMARY KEY,
    user_id     uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    code_hash   bytea       NOT NULL,
    created_at  timestamptz NOT NULL,
    used_at     timestamptz,
    CONSTRAINT recovery_codes_unique UNIQUE (user_id, code_hash)
);
