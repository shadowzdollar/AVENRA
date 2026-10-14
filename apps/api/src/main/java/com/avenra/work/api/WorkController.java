package com.avenra.work.api;

import com.avenra.contract.v1.api.WorkApi;
import com.avenra.contract.v1.model.CreateRequirementRequest;
import com.avenra.contract.v1.model.CreateTaskRequest;
import com.avenra.contract.v1.model.CreateWorkRequest;
import com.avenra.contract.v1.model.InformationItem;
import com.avenra.contract.v1.model.Requirement;
import com.avenra.contract.v1.model.ReviewRequest;
import com.avenra.contract.v1.model.Task;
import com.avenra.contract.v1.model.TaskStatusRequest;
import com.avenra.contract.v1.model.TransitionRequest;
import com.avenra.contract.v1.model.UpdateWorkRequest;
import com.avenra.contract.v1.model.ValueSubmission;
import com.avenra.contract.v1.model.WorkDetail;
import com.avenra.contract.v1.model.WorkStatus;
import com.avenra.contract.v1.model.WorkSummary;
import com.avenra.contract.v1.model.WorkTransition;
import com.avenra.platform.security.CurrentUser;
import com.avenra.work.application.InformationService;
import com.avenra.work.application.WorkService;
import com.avenra.work.domain.WorkFilter;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
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

/** Implements the contract's work operations (ADR-008). */
@RestController
class WorkController implements WorkApi {

    private final WorkService work;
    private final InformationService information;

    WorkController(WorkService work, InformationService information) {
        this.work = work;
        this.information = information;
    }

    @Override
    public ResponseEntity<List<WorkSummary>> listWork(
            UUID organizationId, @Nullable UUID projectId, @Nullable UUID clientId, @Nullable WorkStatus status) {
        var filter = new WorkFilter(
                projectId,
                clientId,
                status == null ? null : com.avenra.work.domain.WorkStatus.valueOf(status.getValue()));
        return ResponseEntity.ok(work.list(userId(), organizationId, filter));
    }

    @Override
    public ResponseEntity<WorkDetail> createWork(UUID organizationId, String idempotencyKey, CreateWorkRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(work.create(userId(), organizationId, idempotencyKey, body));
    }

    @Override
    public ResponseEntity<WorkDetail> getWork(UUID organizationId, UUID workId) {
        return ResponseEntity.ok(work.get(userId(), organizationId, workId));
    }

    @Override
    public ResponseEntity<WorkDetail> updateWork(UUID organizationId, UUID workId, UpdateWorkRequest body) {
        return ResponseEntity.ok(work.update(userId(), organizationId, workId, body));
    }

    @Override
    public ResponseEntity<List<WorkTransition>> listWorkTransitions(UUID organizationId, UUID workId) {
        return ResponseEntity.ok(work.history(userId(), organizationId, workId));
    }

    @Override
    public ResponseEntity<WorkDetail> transitionWork(UUID organizationId, UUID workId, TransitionRequest body) {
        return ResponseEntity.ok(work.transition(userId(), organizationId, workId, body));
    }

    @Override
    public ResponseEntity<Task> createTask(
            UUID organizationId, UUID workId, String idempotencyKey, CreateTaskRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(work.createTask(userId(), organizationId, workId, idempotencyKey, body));
    }

    @Override
    public ResponseEntity<Task> setTaskStatus(UUID organizationId, UUID workId, UUID taskId, TaskStatusRequest body) {
        return ResponseEntity.ok(work.setTaskStatus(userId(), organizationId, workId, taskId, body));
    }

    @Override
    public ResponseEntity<Requirement> createRequirement(
            UUID organizationId, UUID workId, String idempotencyKey, CreateRequirementRequest body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(work.createRequirement(userId(), organizationId, workId, idempotencyKey, body));
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

    private static UUID userId() {
        return CurrentUser.require().userId();
    }
}
