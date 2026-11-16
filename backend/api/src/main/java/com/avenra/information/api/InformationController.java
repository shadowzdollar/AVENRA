package com.avenra.information.api;

import com.avenra.contract.v1.api.InformationApi;
import com.avenra.contract.v1.model.CreateRequirementRequest;
import com.avenra.contract.v1.model.InformationItem;
import com.avenra.contract.v1.model.Requirement;
import com.avenra.contract.v1.model.RequirementRulesInput;
import com.avenra.contract.v1.model.ReviewRequest;
import com.avenra.contract.v1.model.ValueSubmission;
import com.avenra.contract.v1.model.VerificationResult;
import com.avenra.information.application.InformationService;
import com.avenra.platform.security.CurrentUser;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Implements the contract's information operations (ADR-008, ADR-026). */
@RestController
class InformationController implements InformationApi {

    private final InformationService information;

    InformationController(InformationService information) {
        this.information = information;
    }

    @Override
    public ResponseEntity<Requirement> createRequirement(
            UUID organizationId, UUID workId, String idempotencyKey, CreateRequirementRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(information.createRequirement(userId(), organizationId, workId, idempotencyKey, body));
    }

    @Override
    public ResponseEntity<List<InformationItem>> listInformationItems(
            UUID organizationId, UUID workId, UUID requirementId) {
        return ResponseEntity.ok(information.items(userId(), organizationId, workId, requirementId));
    }

    @Override
    public ResponseEntity<InformationItem> submitValue(
            UUID organizationId, UUID workId, UUID requirementId, ValueSubmission body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(information.submitValue(userId(), organizationId, workId, requirementId, body.getValue()));
    }

    @Override
    public ResponseEntity<InformationItem> uploadFile(
            UUID organizationId, UUID workId, UUID requirementId, MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(information.uploadFile(
                        userId(),
                        organizationId,
                        workId,
                        requirementId,
                        Uploads.open(file),
                        file.getOriginalFilename()));
    }

    @Override
    public ResponseEntity<Requirement> reviewInformation(
            UUID organizationId, UUID workId, UUID requirementId, ReviewRequest body) {
        return ResponseEntity.ok(information.review(userId(), organizationId, workId, requirementId, body));
    }

    /** Files are always attachments with the detected type and no sniffing (ADR-019). */
    @Override
    public ResponseEntity<Resource> downloadDocument(UUID organizationId, UUID documentId, Integer version) {
        var download = information.download(userId(), organizationId, documentId, version);
        var stored = download.version();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(stored.contentType()))
                .contentLength(stored.sizeBytes())
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(stored.fileName(), StandardCharsets.UTF_8)
                                .build()
                                .toString())
                .header("X-Content-Type-Options", "nosniff")
                .header("Content-Security-Policy", "default-src 'none'; sandbox")
                .header("X-Avenra-Sha256", stored.sha256Hex())
                .cacheControl(CacheControl.noStore())
                .body(new InputStreamResource(download.content()));
    }

    @Override
    public ResponseEntity<Requirement> setRequirementRules(
            UUID organizationId, UUID workId, UUID requirementId, RequirementRulesInput body) {
        return ResponseEntity.ok(information.setRules(userId(), organizationId, workId, requirementId, body));
    }

    @Override
    public ResponseEntity<List<VerificationResult>> listVerifications(
            UUID organizationId, UUID workId, UUID requirementId) {
        return ResponseEntity.ok(information.verifications(userId(), organizationId, workId, requirementId));
    }

    private static UUID userId() {
        return CurrentUser.require().userId();
    }
}
