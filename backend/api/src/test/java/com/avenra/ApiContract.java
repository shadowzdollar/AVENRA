package com.avenra;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.yaml.snakeyaml.Yaml;
import tools.jackson.databind.JsonNode;

/**
 * Read access to the OpenAPI contract (ADR-008) for contract tests, with a deliberately small
 * schema check covering the constructs the contract uses: objects with required and declared
 * properties, strings and arrays.
 */
public final class ApiContract {

    public static final Path V1 = Path.of("../../packages/contracts/openapi/avenra.v1.yaml");

    private static final List<String> HTTP_METHODS = List.of("get", "put", "post", "delete", "patch");

    private final Map<String, Object> root;

    private ApiContract(Map<String, Object> root) {
        this.root = root;
    }

    public static ApiContract v1() {
        try (InputStream in = Files.newInputStream(V1)) {
            return new ApiContract(new Yaml().load(in));
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }
    }

    /** One operation of the contract. */
    public record Operation(String method, String path, String operationId, String permission) {

        public boolean isPublic() {
            return "public".equals(permission);
        }
    }

    public List<Operation> operations() {
        List<Operation> operations = new ArrayList<>();
        map(root.get("paths"))
                .forEach((path, item) -> map(item).forEach((method, value) -> {
                    if (HTTP_METHODS.contains(method)) {
                        Map<String, Object> operation = map(value);
                        operations.add(new Operation(
                                method.toUpperCase(), path, (String) operation.get("operationId"), (String)
                                        operation.get("x-avenra-permission")));
                    }
                }));
        return operations;
    }

    /** Asserts that {@code json} conforms to the named component schema. */
    public void assertConforms(JsonNode json, String schemaName) {
        assertConforms(json, schema("#/components/schemas/" + schemaName), schemaName);
    }

    private void assertConforms(JsonNode json, Map<String, Object> schema, String where) {
        if (schema.containsKey("$ref")) {
            assertConforms(json, schema((String) schema.get("$ref")), where);
            return;
        }
        switch ((String) schema.get("type")) {
            case "object" -> {
                assertThat(json.isObject()).as("%s is an object", where).isTrue();
                Map<String, Object> properties = map(schema.getOrDefault("properties", Map.of()));
                for (Object required : list(schema.getOrDefault("required", List.of()))) {
                    assertThat(json.has((String) required))
                            .as("%s has required property '%s'", where, required)
                            .isTrue();
                }
                if (Boolean.FALSE.equals(schema.get("additionalProperties"))) {
                    assertThat(json.propertyNames())
                            .as("%s has only declared properties", where)
                            .allMatch(properties::containsKey);
                }
                json.properties().forEach(entry -> {
                    if (properties.containsKey(entry.getKey())) {
                        assertConforms(
                                entry.getValue(), map(properties.get(entry.getKey())), where + "." + entry.getKey());
                    }
                });
            }
            case "array" -> {
                assertThat(json.isArray()).as("%s is an array", where).isTrue();
                Map<String, Object> items = map(schema.get("items"));
                for (int i = 0; i < json.size(); i++) {
                    assertConforms(json.get(i), items, where + "[" + i + "]");
                }
            }
            case "string" ->
                assertThat(json.isString()).as("%s is a string", where).isTrue();
            default -> throw new IllegalStateException("Schema type not supported by this check: " + schema);
        }
    }

    private Map<String, Object> schema(String ref) {
        Object node = root;
        for (String segment : ref.substring(2).split("/")) {
            node = map(node).get(segment);
        }
        assertThat(node).as("contract defines %s", ref).isNotNull();
        return map(node);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> map(Object value) {
        return (Map<String, Object>) value;
    }

    private static List<?> list(Object value) {
        return (List<?>) value;
    }
}
