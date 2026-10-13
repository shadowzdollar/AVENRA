package com.avenra;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;
import org.springframework.modulith.Modulithic;

/**
 * Avenra backend entry point.
 *
 * <p>Every direct sub-package of {@code com.avenra} is an application module (ADR-001). A module's
 * top-level package is its public API; its sub-packages are internal and may not be used by other
 * modules. This is verified by {@code com.avenra.architecture.ModularityTest}.
 */
// The fallback in-memory user is excluded: it prints a generated password to the log (ADR-011).
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@Modulithic(systemName = "Avenra", sharedModules = "platform")
public class AvenraApplication {

    public static void main(String[] args) {
        SpringApplication.run(AvenraApplication.class, args);
    }
}
