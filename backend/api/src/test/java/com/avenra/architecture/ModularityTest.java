package com.avenra.architecture;

import com.avenra.AvenraApplication;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

/**
 * Verifies module boundaries (ADR-001, Guidelines §14): no dependency cycles between modules and no
 * module using another module's internal packages.
 */
class ModularityTest {

    private static final ApplicationModules MODULES = ApplicationModules.of(AvenraApplication.class);

    @Test
    void modulesRespectTheirBoundaries() {
        MODULES.verify();
    }

    @Test
    void writesModuleDocumentation() {
        // Generates module diagrams and a module canvas under target/spring-modulith-docs.
        new Documenter(MODULES).writeDocumentation();
    }
}
