package com.avenra.platform.web;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.jspecify.annotations.Nullable;

/** Times in API responses are always UTC (Guidelines §38). */
public final class ApiTime {

    private ApiTime() {}

    public static OffsetDateTime utc(OffsetDateTime time) {
        return time.withOffsetSameInstant(ZoneOffset.UTC);
    }

    public static @Nullable OffsetDateTime utcOrNull(@Nullable OffsetDateTime time) {
        return time == null ? null : utc(time);
    }
}
