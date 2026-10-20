package com.avenra.integration.infrastructure;

import com.avenra.integration.domain.Provider;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Connections and deliveries (ADR-034); every query runs under row-level security. */
@Repository
public class IntegrationRepository {

    public record ConnectionRow(
            UUID id,
            UUID organizationId,
            Provider provider,
            String name,
            String status,
            List<String> events,
            String settings,
            @Nullable String credentialKeyId,
            byte @Nullable [] credentialCiphertext,
            @Nullable String credentialHint,
            int consecutiveFailures,
            @Nullable OffsetDateTime lastDeliveryAt,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt) {}

    public record DeliveryRow(
            UUID id,
            UUID organizationId,
            UUID connectionId,
            UUID eventId,
            String eventType,
            String payload,
            String status,
            int attempts,
            @Nullable Integer lastStatusCode,
            @Nullable String lastError,
            OffsetDateTime createdAt,
            @Nullable OffsetDateTime deliveredAt) {}

    private static final String CONNECTION_COLUMNS = """
            id, organization_id, provider, name, status, events, settings::text, credential_key_id,
            credential_ciphertext, credential_hint, consecutive_failures, last_delivery_at, created_at, updated_at""";

    private static final String DELIVERY_COLUMNS = """
            id, organization_id, connection_id, event_id, event_type, payload::text, status, attempts,
            last_status_code, last_error, created_at, delivered_at""";

    private final JdbcClient jdbc;

    IntegrationRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(ConnectionRow row, UUID createdBy) {
        jdbc.sql("""
                        insert into integration_connections (id, organization_id, provider, name, status, events,
                            settings, credential_key_id, credential_ciphertext, credential_hint, created_by,
                            created_at, updated_at)
                        values (:id, :org, :provider, :name, :status, :events, cast(:settings as jsonb), :keyId,
                            :ciphertext, :hint, :by, :now, :now)
                        """)
                .param("id", row.id())
                .param("org", row.organizationId())
                .param("provider", row.provider().name())
                .param("name", row.name())
                .param("status", row.status())
                .param("events", row.events().toArray(String[]::new))
                .param("settings", row.settings())
                .param("keyId", row.credentialKeyId())
                .param("ciphertext", row.credentialCiphertext())
                .param("hint", row.credentialHint())
                .param("by", createdBy)
                .param("now", row.createdAt())
                .update();
    }

    public List<ConnectionRow> connections(UUID organizationId) {
        return jdbc.sql("select " + CONNECTION_COLUMNS
                        + " from integration_connections where organization_id = :org and status <> 'REVOKED'"
                        + " order by created_at, id")
                .param("org", organizationId)
                .query(IntegrationRepository::connection)
                .list();
    }

    public Optional<ConnectionRow> find(UUID organizationId, UUID id) {
        return jdbc.sql("select " + CONNECTION_COLUMNS
                        + " from integration_connections where organization_id = :org and id = :id")
                .param("org", organizationId)
                .param("id", id)
                .query(IntegrationRepository::connection)
                .optional();
    }

    public Optional<ConnectionRow> findForUpdate(UUID organizationId, UUID id) {
        return jdbc.sql("select " + CONNECTION_COLUMNS
                        + " from integration_connections where organization_id = :org and id = :id for update")
                .param("org", organizationId)
                .param("id", id)
                .query(IntegrationRepository::connection)
                .optional();
    }

    public void update(UUID id, String name, List<String> events, String status, OffsetDateTime now) {
        jdbc.sql("""
                        update integration_connections set name = :name, events = :events, status = :status,
                            consecutive_failures = case when :status = 'ACTIVE' and status <> 'ACTIVE' then 0
                                                        else consecutive_failures end,
                            updated_at = :now
                        where id = :id
                        """)
                .param("id", id)
                .param("name", name)
                .param("events", events.toArray(String[]::new))
                .param("status", status)
                .param("now", now)
                .update();
    }

    public void replaceCredentials(UUID id, String keyId, byte[] ciphertext, String hint, OffsetDateTime now) {
        jdbc.sql("""
                        update integration_connections set credential_key_id = :keyId,
                            credential_ciphertext = :ciphertext, credential_hint = :hint, updated_at = :now
                        where id = :id
                        """)
                .param("id", id)
                .param("keyId", keyId)
                .param("ciphertext", ciphertext)
                .param("hint", hint)
                .param("now", now)
                .update();
    }

    /** Revocation deletes the secret; the connection's record and deliveries stay for history. */
    public void revoke(UUID id, OffsetDateTime now) {
        jdbc.sql("""
                        update integration_connections set status = 'REVOKED', credential_key_id = null,
                            credential_ciphertext = null, revoked_at = :now, updated_at = :now
                        where id = :id
                        """).param("id", id).param("now", now).update();
    }

    /** Records a delivery's outcome on its connection; returns the consecutive failures now. */
    public int recordOutcome(UUID id, boolean delivered, OffsetDateTime now) {
        return jdbc.sql("""
                        update integration_connections set
                            consecutive_failures = case when :delivered then 0 else consecutive_failures + 1 end,
                            last_delivery_at = case when :delivered then :now else last_delivery_at end,
                            updated_at = :now
                        where id = :id
                        returning consecutive_failures
                        """)
                .param("id", id)
                .param("delivered", delivered)
                .param("now", now)
                .query(Integer.class)
                .single();
    }

    public void pause(UUID id, OffsetDateTime now) {
        jdbc.sql("update integration_connections set status = 'PAUSED', updated_at = :now where id = :id"
                        + " and status = 'ACTIVE'")
                .param("id", id)
                .param("now", now)
                .update();
    }

    /** Active connections of the organization subscribed to an event type. */
    public List<ConnectionRow> subscribed(UUID organizationId, String eventType) {
        return jdbc.sql("select " + CONNECTION_COLUMNS
                        + " from integration_connections where organization_id = :org and status = 'ACTIVE'"
                        + " and :type = any(events) order by created_at, id")
                .param("org", organizationId)
                .param("type", eventType)
                .query(IntegrationRepository::connection)
                .list();
    }

    /** Active connections with a provider, e.g. every storage export. */
    public List<ConnectionRow> active(UUID organizationId, Provider provider) {
        return jdbc.sql("select " + CONNECTION_COLUMNS
                        + " from integration_connections where organization_id = :org and status = 'ACTIVE'"
                        + " and provider = :provider order by created_at, id")
                .param("org", organizationId)
                .param("provider", provider.name())
                .query(IntegrationRepository::connection)
                .list();
    }

    /** Records a delivery unless that event was already recorded for the connection; true when new. */
    public boolean insertDelivery(DeliveryRow row) {
        return jdbc.sql("""
                        insert into integration_deliveries (id, organization_id, connection_id, event_id, event_type,
                            payload, status, created_at)
                        values (:id, :org, :connection, :event, :type, cast(:payload as jsonb), 'PENDING', :now)
                        on conflict (connection_id, event_id) do nothing
                        """)
                        .param("id", row.id())
                        .param("org", row.organizationId())
                        .param("connection", row.connectionId())
                        .param("event", row.eventId())
                        .param("type", row.eventType())
                        .param("payload", row.payload())
                        .param("now", row.createdAt())
                        .update()
                == 1;
    }

    public Optional<DeliveryRow> findDeliveryForUpdate(UUID id) {
        return jdbc.sql("select " + DELIVERY_COLUMNS + " from integration_deliveries where id = :id for update")
                .param("id", id)
                .query(IntegrationRepository::delivery)
                .optional();
    }

    public Optional<DeliveryRow> findDelivery(UUID organizationId, UUID connectionId, UUID id) {
        return jdbc.sql("select " + DELIVERY_COLUMNS + " from integration_deliveries"
                        + " where organization_id = :org and connection_id = :connection and id = :id")
                .param("org", organizationId)
                .param("connection", connectionId)
                .param("id", id)
                .query(IntegrationRepository::delivery)
                .optional();
    }

    public void updateDelivery(
            UUID id,
            String status,
            int attempts,
            @Nullable Integer statusCode,
            @Nullable String error,
            @Nullable OffsetDateTime deliveredAt) {
        jdbc.sql("""
                        update integration_deliveries set status = :status, attempts = :attempts,
                            last_status_code = :code, last_error = :error, delivered_at = :delivered
                        where id = :id
                        """)
                .param("id", id)
                .param("status", status)
                .param("attempts", attempts)
                .param("code", statusCode)
                .param("error", error)
                .param("delivered", deliveredAt)
                .update();
    }

    public List<DeliveryRow> deliveries(UUID organizationId, UUID connectionId) {
        return jdbc.sql("select " + DELIVERY_COLUMNS + " from integration_deliveries"
                        + " where organization_id = :org and connection_id = :connection"
                        + " order by created_at desc, id limit 100")
                .param("org", organizationId)
                .param("connection", connectionId)
                .query(IntegrationRepository::delivery)
                .list();
    }

    /** Pending deliveries of a connection, for when it is resumed. */
    public List<UUID> pending(UUID organizationId, UUID connectionId) {
        return jdbc.sql("select id from integration_deliveries where organization_id = :org"
                        + " and connection_id = :connection and status = 'PENDING' order by created_at limit 500")
                .param("org", organizationId)
                .param("connection", connectionId)
                .query(UUID.class)
                .list();
    }

    private static ConnectionRow connection(ResultSet rs, int row) throws SQLException {
        return new ConnectionRow(
                rs.getObject(1, UUID.class),
                rs.getObject(2, UUID.class),
                Provider.valueOf(rs.getString(3)),
                rs.getString(4),
                rs.getString(5),
                Arrays.asList((String[]) rs.getArray(6).getArray()),
                rs.getString(7),
                rs.getString(8),
                rs.getBytes(9),
                rs.getString(10),
                rs.getInt(11),
                rs.getObject(12, OffsetDateTime.class),
                rs.getObject(13, OffsetDateTime.class),
                rs.getObject(14, OffsetDateTime.class));
    }

    private static DeliveryRow delivery(ResultSet rs, int row) throws SQLException {
        return new DeliveryRow(
                rs.getObject(1, UUID.class),
                rs.getObject(2, UUID.class),
                rs.getObject(3, UUID.class),
                rs.getObject(4, UUID.class),
                rs.getString(5),
                rs.getString(6),
                rs.getString(7),
                rs.getInt(8),
                (Integer) rs.getObject(9),
                rs.getString(10),
                rs.getObject(11, OffsetDateTime.class),
                rs.getObject(12, OffsetDateTime.class));
    }
}
