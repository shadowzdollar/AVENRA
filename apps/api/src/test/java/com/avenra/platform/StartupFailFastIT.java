package com.avenra.platform;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.avenra.StandaloneApplication;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

/** The application refuses to start with missing or unsafe configuration (Guidelines §91). */
class StartupFailFastIT {

    private static Map<String, Object> testPropertiesWith(String key, Object value) {
        var properties = new HashMap<>(StandaloneApplication.testProperties());
        properties.put(key, value);
        return properties;
    }

    private static Map<String, Object> testPropertiesWithout(String key) {
        var properties = new HashMap<>(StandaloneApplication.testProperties());
        properties.remove(key);
        return properties;
    }

    @Test
    void refusesToStartWithoutAnEnvironmentProfile() {
        assertThatThrownBy(() -> StandaloneApplication.start(testPropertiesWith("spring.profiles.active", "")))
                .hasStackTraceContaining("avenra.environment");
    }

    @Test
    void refusesToStartWithoutDatabaseUrl() {
        assertThatThrownBy(() -> StandaloneApplication.start(testPropertiesWithout("AVENRA_DB_URL")))
                .hasStackTraceContaining("AVENRA_DB_URL");
    }

    @Test
    void refusesToStartWithAWildcardCorsOrigin() {
        assertThatThrownBy(() -> StandaloneApplication.start(testPropertiesWith("avenra.web.allowed-origins", "*")))
                .hasStackTraceContaining("wildcards are not permitted");
    }
}
