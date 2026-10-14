package com.avenra.work.domain;

import java.util.UUID;
import org.jspecify.annotations.Nullable;

/** Narrows a list of work; absent values do not filter. */
public record WorkFilter(
        @Nullable UUID projectId,
        @Nullable UUID clientId,
        @Nullable WorkStatus status) {}
