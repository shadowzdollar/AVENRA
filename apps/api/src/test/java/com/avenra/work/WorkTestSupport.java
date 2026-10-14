package com.avenra.work;

import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.BrowserClient;
import com.avenra.PostgresTestDatabase;
import com.avenra.TestOutbox;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import tools.jackson.databind.JsonNode;

/** Helpers shared by the Phase 3 API tests. */
final class WorkTestSupport {

    private static final Pattern LINK_TOKEN = Pattern.compile("/request#([A-Za-z0-9_-]+)");

    private WorkTestSupport() {}

    static String org(UUID organization) {
        return "/api/v1/organizations/" + organization;
    }

    static Map<String, String> key() {
        return Map.of("Idempotency-Key", BrowserClient.key());
    }

    static UUID id(BrowserClient.Response response) {
        return UUID.fromString(response.body().get("id").asString());
    }

    static BrowserClient.Response created(BrowserClient.Response response) {
        assertThat(response.status()).as(response.raw().body()).isEqualTo(201);
        return response;
    }

    static BrowserClient.Response ok(BrowserClient.Response response) {
        assertThat(response.status()).as(response.raw().body()).isEqualTo(200);
        return response;
    }

    static UUID createWork(BrowserClient user, UUID organization, String title) {
        return id(created(user.post(org(organization) + "/work", Map.of("title", title), key())));
    }

    static UUID requirement(
            BrowserClient user, UUID organization, UUID work, String title, String kind, boolean required) {
        return id(created(user.post(
                org(organization) + "/work/" + work + "/requirements",
                Map.of("title", title, "kind", kind, "required", required, "instructions", "Please provide " + title),
                key())));
    }

    static JsonNode work(BrowserClient user, UUID organization, UUID work) {
        return ok(user.get(org(organization) + "/work/" + work)).body();
    }

    static String status(BrowserClient user, UUID organization, UUID work) {
        return work(user, organization, work).get("status").asString();
    }

    static BrowserClient.Response transition(
            BrowserClient user, UUID organization, UUID work, String from, String to, String reason) {
        var body = new java.util.HashMap<String, Object>(Map.of("to", to, "expectedStatus", from));
        if (reason != null) {
            body.put("reason", reason);
        }
        return user.post(org(organization) + "/work/" + work + "/transitions", body);
    }

    static JsonNode requirementOf(JsonNode work, UUID requirement) {
        for (JsonNode node : work.get("requirements")) {
            if (node.get("id").asString().equals(requirement.toString())) {
                return node;
            }
        }
        throw new AssertionError("no requirement " + requirement);
    }

    static String linkToken(TestOutbox outbox, String email) {
        var messages = outbox.to(email).stream()
                .filter(message -> message.category().equals("request-link"))
                .toList();
        assertThat(messages).isNotEmpty();
        var matcher = LINK_TOKEN.matcher(messages.getLast().body());
        assertThat(matcher.find()).isTrue();
        return matcher.group(1);
    }

    static Map<String, String> token(String token) {
        return Map.of("X-Avenra-Request-Token", token);
    }

    static byte[] pdf(String text) {
        return ("%PDF-1.7\n% " + text + "\n%%EOF\n").getBytes(StandardCharsets.US_ASCII);
    }

    static byte[] docx() {
        return zip(List.of("[Content_Types].xml", "word/document.xml"));
    }

    static byte[] zip(List<String> entries) {
        var out = new ByteArrayOutputStream();
        try (var zip = new ZipOutputStream(out)) {
            for (String entry : entries) {
                zip.putNextEntry(new ZipEntry(entry));
                zip.write("<x/>".getBytes(StandardCharsets.UTF_8));
                zip.closeEntry();
            }
        } catch (IOException impossible) {
            throw new UncheckedIOException(impossible);
        }
        return out.toByteArray();
    }

    /**
     * The EICAR test file: harmless, detected by every scanner. Assembled at runtime so the source
     * file itself is not flagged by scanners on developer machines.
     */
    static byte[] eicar() {
        String signature = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$" + "EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";
        return signature.getBytes(StandardCharsets.US_ASCII);
    }

    /** Rows of a query run as the schema owner (sees every tenant; for assertions only). */
    static List<List<Object>> ownerQuery(String sql, Object... parameters) {
        try (var connection = DriverManager.getConnection(
                        PostgresTestDatabase.jdbcUrl(),
                        PostgresTestDatabase.OWNER_USER,
                        PostgresTestDatabase.OWNER_PASSWORD);
                var statement = connection.prepareStatement(sql)) {
            for (int i = 0; i < parameters.length; i++) {
                statement.setObject(i + 1, parameters[i]);
            }
            var rows = new ArrayList<List<Object>>();
            try (var result = statement.executeQuery()) {
                int columns = result.getMetaData().getColumnCount();
                while (result.next()) {
                    var row = new ArrayList<Object>();
                    for (int column = 1; column <= columns; column++) {
                        row.add(result.getObject(column));
                    }
                    rows.add(row);
                }
            }
            return rows;
        } catch (SQLException failure) {
            throw new IllegalStateException(failure);
        }
    }

    static void ownerUpdate(String sql, Object... parameters) {
        try (var connection = DriverManager.getConnection(
                        PostgresTestDatabase.jdbcUrl(),
                        PostgresTestDatabase.OWNER_USER,
                        PostgresTestDatabase.OWNER_PASSWORD);
                var statement = connection.prepareStatement(sql)) {
            for (int i = 0; i < parameters.length; i++) {
                statement.setObject(i + 1, parameters[i]);
            }
            statement.executeUpdate();
        } catch (SQLException failure) {
            throw new IllegalStateException(failure);
        }
    }

    static List<String> auditActions(UUID organization) {
        return ownerQuery(
                        "select action from audit_events where organization_id = ? order by occurred_at", organization)
                .stream()
                .map(row -> (String) row.getFirst())
                .toList();
    }
}
