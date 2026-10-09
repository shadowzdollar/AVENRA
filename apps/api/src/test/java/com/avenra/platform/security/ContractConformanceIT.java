package com.avenra.platform.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.ApiContract;
import com.avenra.IntegrationTest;
import com.avenra.IntegrationTestBase;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import java.net.http.HttpRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import tools.jackson.databind.json.JsonMapper;

/**
 * Contract tests (Guidelines §76, ADR-008): the running application and the OpenAPI contract
 * agree on which operations exist, who may call them, and the shape of what they return.
 */
@IntegrationTest
class ContractConformanceIT extends IntegrationTestBase {

    private static final ApiContract CONTRACT = ApiContract.v1();

    @Autowired
    private ApplicationContext context;

    @Autowired
    private JsonMapper json;

    @Test
    void everyGeneratedApiInterfaceIsImplemented() {
        var interfaces = new ClassFileImporter()
                .importPackages("com.avenra.contract.v1.api").stream()
                        .filter(JavaClass::isInterface)
                        .filter(type -> type.getSimpleName().endsWith("Api"))
                        .map(JavaClass::reflect)
                        .toList();

        assertThat(interfaces).isNotEmpty();
        assertThat(interfaces)
                .allSatisfy(type -> assertThat(context.getBeanNamesForType(type))
                        .as("a bean implements %s", type.getSimpleName())
                        .isNotEmpty());
    }

    @Test
    void anonymousAccessMatchesTheDeclaredPermissions() {
        for (ApiContract.Operation operation : CONTRACT.operations()) {
            int status = send(request(operation.path())
                            .method(operation.method(), HttpRequest.BodyPublishers.noBody())
                            .build())
                    .statusCode();

            if (operation.isPublic()) {
                assertThat(status).as("%s is public", operation.operationId()).isNotIn(401, 403);
            } else {
                assertThat(status)
                        .as("%s requires authentication", operation.operationId())
                        .isEqualTo(401);
            }
        }
    }

    @Test
    void everyPublicApiPathIsDeclaredPublicInTheContract() {
        var publicInContract = CONTRACT.operations().stream()
                .filter(ApiContract.Operation::isPublic)
                .filter(operation -> operation.method().equals("GET"))
                .map(ApiContract.Operation::path)
                .toList();

        assertThat(WebSecurityConfiguration.PUBLIC_GET_PATHS.stream().filter(path -> path.startsWith("/api/")))
                .as("public API paths in the security configuration")
                .allMatch(publicInContract::contains);
    }

    @Test
    void metaResponseConformsToTheContract() {
        var response = get("/api/v1/meta");

        assertThat(response.statusCode()).isEqualTo(200);
        CONTRACT.assertConforms(json.readTree(response.body()), "ApiMeta");
    }

    @Test
    void errorResponsesConformToTheContract() {
        CONTRACT.assertConforms(json.readTree(get("/api/v1/not-a-resource").body()), "ErrorResponse");

        var validationError = send(request("/__test/echo")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"name\":\"\"}"))
                .build());
        var body = json.readTree(validationError.body());
        assertThat(body.get("details")).isNotEmpty();
        CONTRACT.assertConforms(body, "ErrorResponse");
    }
}
