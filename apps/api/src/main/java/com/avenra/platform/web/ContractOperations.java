package com.avenra.platform.web;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;

/**
 * The {@code x-avenra-*} declarations of every contract operation, read at startup from the
 * contract packaged with the application (ADR-008). Runtime policies such as rate limits come from
 * this single source instead of being repeated in code.
 */
@Component
public class ContractOperations {

    private static final List<String> METHODS = List.of("get", "put", "post", "delete", "patch");

    /** The declarations of one operation. */
    public record Operation(String operationId, String method, String path, String permission, String rateLimit) {}

    private final Map<String, Operation> byOperationId;

    ContractOperations() {
        this.byOperationId = load();
    }

    public Optional<Operation> find(String operationId) {
        return Optional.ofNullable(byOperationId.get(operationId));
    }

    public java.util.Collection<Operation> all() {
        return byOperationId.values();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Operation> load() {
        try (InputStream in = new ClassPathResource("contracts/avenra.v1.yaml").getInputStream()) {
            Map<String, Object> root = new Yaml(new SafeConstructor(new LoaderOptions())).load(in);
            Map<String, Operation> operations = new HashMap<>();
            ((Map<String, Map<String, Object>>) root.get("paths"))
                    .forEach((path, item) -> item.forEach((method, value) -> {
                        if (METHODS.contains(method)) {
                            Map<String, Object> op = (Map<String, Object>) value;
                            String id = (String) op.get("operationId");
                            operations.put(
                                    id,
                                    new Operation(
                                            id,
                                            method.toUpperCase(),
                                            path,
                                            (String) op.get("x-avenra-permission"),
                                            (String) op.get("x-avenra-rate-limit")));
                        }
                    }));
            return Map.copyOf(operations);
        } catch (IOException exception) {
            throw new UncheckedIOException("The API contract is missing from the classpath", exception);
        }
    }
}
