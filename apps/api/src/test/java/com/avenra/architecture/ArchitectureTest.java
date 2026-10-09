package com.avenra.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.FieldSource;

/** Checks the Guidelines' architecture rules against the production code base. */
class ArchitectureTest {

    private static final JavaClasses PRODUCTION_CLASSES = new ClassFileImporter()
            .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
            .importPackages("com.avenra");

    @ParameterizedTest(name = "{0}")
    @FieldSource("com.avenra.architecture.ArchitectureRules#ALL")
    void productionCodeFollowsRule(ArchRule rule) {
        rule.check(PRODUCTION_CLASSES);
    }
}
