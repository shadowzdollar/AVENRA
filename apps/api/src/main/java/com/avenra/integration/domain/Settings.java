package com.avenra.integration.domain;

import org.jspecify.annotations.Nullable;

/** A connection's non-secret settings (ADR-034); only those of its provider are set. */
public record Settings(
        @Nullable String url,
        @Nullable String endpoint,
        @Nullable String region,
        @Nullable String bucket,
        @Nullable String prefix,
        @Nullable Boolean pathStyle) {}
