package com.avenra.architecture;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.core.Violations;

/**
 * Proves that the architecture checks actually detect violations, using deliberately broken fixture
 * code under {@code fixtures.architecture}. Without these tests, a misconfigured rule could pass
 * silently forever.
 */
class ArchitectureRulesSelfTest {

    @Test
    void detectsUseOfAnotherModulesInternals() {
        // The fixtures are test classes, which Modulith skips by default; include them here.
        ImportOption includeTestClasses = location -> true;
        var modules = ApplicationModules.of("fixtures.architecture.modules", includeTestClasses);

        assertThatThrownBy(modules::verify).isInstanceOf(Violations.class).hasMessageContaining("BetaInternal");
    }

    @Test
    void detectsDomainDependingOnInfrastructure() {
        JavaClasses classes = new ClassFileImporter().importPackages("fixtures.architecture.layers");

        assertThatThrownBy(() -> ArchitectureRules.DOMAIN_IS_INDEPENDENT.check(classes))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("LeakyDomainObject");
    }

    @Test
    void detectsFieldInjection() {
        JavaClasses classes = new ClassFileImporter().importPackages("fixtures.architecture.injection");

        assertThatThrownBy(() -> ArchitectureRules.NO_FIELD_INJECTION.check(classes))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("FieldInjectedService");
    }

    @Test
    void detectsConsoleLogging() {
        JavaClasses classes = new ClassFileImporter().importPackages("fixtures.architecture.injection");

        assertThatThrownBy(() -> ArchitectureRules.NO_CONSOLE_OR_JUL_LOGGING.check(classes))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("ConsolePrinter");
    }
}
