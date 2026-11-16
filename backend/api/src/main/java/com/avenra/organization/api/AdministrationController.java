package com.avenra.organization.api;

import com.avenra.audit.AuditHistory;
import com.avenra.contract.v1.api.AdministrationApi;
import com.avenra.contract.v1.model.AdministrationOverview;
import com.avenra.contract.v1.model.AuditPage;
import com.avenra.contract.v1.model.RolePermissions;
import com.avenra.organization.application.AdministrationService;
import com.avenra.platform.security.CurrentUser;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/** Implements the contract's administration operations (ADR-036). */
@RestController
class AdministrationController implements AdministrationApi {

    private final AdministrationService administration;

    AdministrationController(AdministrationService administration) {
        this.administration = administration;
    }

    @Override
    public ResponseEntity<AuditPage> listAuditEvents(
            UUID organizationId,
            @Nullable String action,
            @Nullable UUID actorUserId,
            @Nullable OffsetDateTime from,
            @Nullable OffsetDateTime to,
            @Nullable String cursor) {
        return ResponseEntity.ok(administration.audit(
                userId(), organizationId, new AuditHistory.Filter(action, actorUserId, from, to), cursor));
    }

    @Override
    public ResponseEntity<String> exportAuditEvents(
            UUID organizationId,
            @Nullable String action,
            @Nullable UUID actorUserId,
            @Nullable OffsetDateTime from,
            @Nullable OffsetDateTime to) {
        String csv = administration.exportAudit(
                userId(), organizationId, new AuditHistory.Filter(action, actorUserId, from, to));
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename("audit-" + organizationId + ".csv")
                                .build()
                                .toString())
                .body(csv);
    }

    @Override
    public ResponseEntity<List<RolePermissions>> listRolePermissions(UUID organizationId) {
        return ResponseEntity.ok(administration.roles(userId(), organizationId));
    }

    @Override
    public ResponseEntity<AdministrationOverview> getAdministrationOverview(UUID organizationId) {
        return ResponseEntity.ok(administration.overview(userId(), organizationId));
    }

    private static UUID userId() {
        return CurrentUser.require().userId();
    }
}
