package com.avenra.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noFields;

import com.tngtech.archunit.lang.ArchRule;
import java.util.List;

/**
 * Architecture rules from the Building Guidelines, defined once so they can be checked against the
 * real code base and against fixtures that prove each rule detects violations.
 */
final class ArchitectureRules {

    private ArchitectureRules() {}

    /** §11: business rules must not depend on application, API or infrastructure code. */
    static final ArchRule DOMAIN_IS_INDEPENDENT = noClasses()
            .that()
            .resideInAPackage("..domain..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("..application..", "..api..", "..infrastructure..")
            .allowEmptyShould(true)
            .because("business rules must not depend on outer layers (Guidelines §11)");

    /** §11: use cases must not depend on the HTTP layer. */
    static final ArchRule APPLICATION_DOES_NOT_DEPEND_ON_API = noClasses()
            .that()
            .resideInAPackage("..application..")
            .should()
            .dependOnClassesThat()
            .resideInAPackage("..api..")
            .allowEmptyShould(true)
            .because("use cases must not depend on the HTTP layer (Guidelines §11)");

    /** §11: the domain must not know about the web framework. */
    static final ArchRule DOMAIN_DOES_NOT_USE_WEB = noClasses()
            .that()
            .resideInAPackage("..domain..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("org.springframework.web..", "jakarta.servlet..")
            .allowEmptyShould(true)
            .because("business rules must not depend on HTTP (Guidelines §11)");

    /** §82: constructor injection only. */
    static final ArchRule NO_FIELD_INJECTION = noFields()
            .should()
            .beAnnotatedWith("org.springframework.beans.factory.annotation.Autowired")
            .orShould()
            .beAnnotatedWith("jakarta.inject.Inject")
            .allowEmptyShould(true)
            .because("use constructor injection (Guidelines §82)");

    /** §62: structured logging only; no console printing or java.util.logging. */
    static final ArchRule NO_CONSOLE_OR_JUL_LOGGING = noClasses()
            .should()
            .accessField(System.class, "out")
            .orShould()
            .accessField(System.class, "err")
            .orShould()
            .dependOnClassesThat()
            .resideInAPackage("java.util.logging..")
            .allowEmptyShould(true)
            .because("logs must be structured and go through SLF4J (Guidelines §62)");

    static final List<ArchRule> ALL = List.of(
            DOMAIN_IS_INDEPENDENT,
            APPLICATION_DOES_NOT_DEPEND_ON_API,
            DOMAIN_DOES_NOT_USE_WEB,
            NO_FIELD_INJECTION,
            NO_CONSOLE_OR_JUL_LOGGING);
}
