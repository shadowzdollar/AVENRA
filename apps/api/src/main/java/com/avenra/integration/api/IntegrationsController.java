package com.avenra.integration.api;

import com.avenra.contract.v1.api.IntegrationsApi;
import com.avenra.contract.v1.model.CreateIntegrationRequest;
import com.avenra.contract.v1.model.IntegrationConnection;
import com.avenra.contract.v1.model.IntegrationCredentialsInput;
import com.avenra.contract.v1.model.IntegrationDelivery;
import com.avenra.contract.v1.model.IntegrationSecret;
import com.avenra.contract.v1.model.UpdateIntegrationRequest;
import com.avenra.integration.application.IntegrationService;
import com.avenra.platform.security.CurrentUser;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/** Implements the contract's integration operations (ADR-008); authorization is in the service. */
@RestController
class IntegrationsController implements IntegrationsApi {

    private final IntegrationService integrations;

    IntegrationsController(IntegrationService integrations) {
        this.integrations = integrations;
    }

    @Override
    public ResponseEntity<List<IntegrationConnection>> listIntegrations(UUID organizationId) {
        return ResponseEntity.ok(integrations.list(userId(), organizationId));
    }

    @Override
    public ResponseEntity<IntegrationSecret> createIntegration(
            UUID organizationId, String idempotencyKey, CreateIntegrationRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(integrations.create(userId(), organizationId, idempotencyKey, body));
    }

    @Override
    public ResponseEntity<IntegrationConnection> updateIntegration(
            UUID organizationId, UUID connectionId, UpdateIntegrationRequest body) {
        return ResponseEntity.ok(integrations.update(userId(), organizationId, connectionId, body));
    }

    @Override
    public ResponseEntity<Void> revokeIntegration(UUID organizationId, UUID connectionId) {
        integrations.revoke(userId(), organizationId, connectionId);
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<IntegrationSecret> rotateIntegrationCredentials(
            UUID organizationId, UUID connectionId, IntegrationCredentialsInput body) {
        return ResponseEntity.ok(integrations.rotate(userId(), organizationId, connectionId, body));
    }

    @Override
    public ResponseEntity<IntegrationDelivery> testIntegration(UUID organizationId, UUID connectionId) {
        return ResponseEntity.ok(integrations.test(userId(), organizationId, connectionId));
    }

    @Override
    public ResponseEntity<List<IntegrationDelivery>> listIntegrationDeliveries(UUID organizationId, UUID connectionId) {
        return ResponseEntity.ok(integrations.deliveries(userId(), organizationId, connectionId));
    }

    @Override
    public ResponseEntity<IntegrationDelivery> redeliverIntegrationDelivery(
            UUID organizationId, UUID connectionId, UUID deliveryId) {
        return ResponseEntity.ok(integrations.redeliver(userId(), organizationId, connectionId, deliveryId));
    }

    private static UUID userId() {
        return CurrentUser.require().userId();
    }
}
