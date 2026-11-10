package com.avenra.information.api;

import com.avenra.contract.v1.api.RequestsApi;
import com.avenra.contract.v1.model.CreateRequestLinkRequest;
import com.avenra.contract.v1.model.RequestLink;
import com.avenra.information.application.RequestLinkService;
import com.avenra.platform.security.CurrentUser;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/** Implements the contract's request-link operations for team members (ADR-020). */
@RestController
class RequestLinksController implements RequestsApi {

    private final RequestLinkService links;

    RequestLinksController(RequestLinkService links) {
        this.links = links;
    }

    @Override
    public ResponseEntity<List<RequestLink>> listRequestLinks(UUID organizationId, UUID workId) {
        return ResponseEntity.ok(links.list(userId(), organizationId, workId));
    }

    @Override
    public ResponseEntity<List<RequestLink>> listOrganizationRequestLinks(
            UUID organizationId, @org.jspecify.annotations.Nullable String status) {
        return ResponseEntity.ok(links.organizationList(userId(), organizationId, status));
    }

    @Override
    public ResponseEntity<RequestLink> remindRequestLink(UUID organizationId, UUID workId, UUID requestLinkId) {
        return ResponseEntity.accepted().body(links.remind(userId(), organizationId, workId, requestLinkId));
    }

    @Override
    public ResponseEntity<RequestLink> createRequestLink(
            UUID organizationId, UUID workId, String idempotencyKey, CreateRequestLinkRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(links.create(userId(), organizationId, workId, idempotencyKey, body));
    }

    @Override
    public ResponseEntity<Void> revokeRequestLink(UUID organizationId, UUID workId, UUID requestLinkId) {
        links.revoke(userId(), organizationId, workId, requestLinkId);
        return ResponseEntity.noContent().build();
    }

    private static UUID userId() {
        return CurrentUser.require().userId();
    }
}
