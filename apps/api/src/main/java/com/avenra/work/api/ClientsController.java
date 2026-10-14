package com.avenra.work.api;

import com.avenra.contract.v1.api.ClientsApi;
import com.avenra.contract.v1.api.ProjectsApi;
import com.avenra.contract.v1.model.Client;
import com.avenra.contract.v1.model.ClientInput;
import com.avenra.contract.v1.model.Project;
import com.avenra.contract.v1.model.ProjectInput;
import com.avenra.platform.security.CurrentUser;
import com.avenra.work.application.ClientService;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/** Implements the contract's client and project operations (ADR-008). */
@RestController
class ClientsController implements ClientsApi, ProjectsApi {

    private final ClientService clients;

    ClientsController(ClientService clients) {
        this.clients = clients;
    }

    @Override
    public ResponseEntity<List<Client>> listClients(UUID organizationId) {
        return ResponseEntity.ok(clients.listClients(userId(), organizationId));
    }

    @Override
    public ResponseEntity<Client> createClient(UUID organizationId, String idempotencyKey, ClientInput body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clients.createClient(userId(), organizationId, idempotencyKey, body));
    }

    @Override
    public ResponseEntity<Client> getClient(UUID organizationId, UUID clientId) {
        return ResponseEntity.ok(clients.getClient(userId(), organizationId, clientId));
    }

    @Override
    public ResponseEntity<Client> updateClient(UUID organizationId, UUID clientId, ClientInput body) {
        return ResponseEntity.ok(clients.updateClient(userId(), organizationId, clientId, body));
    }

    @Override
    public ResponseEntity<List<Project>> listProjects(UUID organizationId, @Nullable UUID clientId) {
        return ResponseEntity.ok(clients.listProjects(userId(), organizationId, clientId));
    }

    @Override
    public ResponseEntity<Project> createProject(UUID organizationId, String idempotencyKey, ProjectInput body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clients.createProject(userId(), organizationId, idempotencyKey, body));
    }

    @Override
    public ResponseEntity<Project> getProject(UUID organizationId, UUID projectId) {
        return ResponseEntity.ok(clients.getProject(userId(), organizationId, projectId));
    }

    @Override
    public ResponseEntity<Project> updateProject(UUID organizationId, UUID projectId, ProjectInput body) {
        return ResponseEntity.ok(clients.updateProject(userId(), organizationId, projectId, body));
    }

    private static UUID userId() {
        return CurrentUser.require().userId();
    }
}
