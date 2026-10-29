package com.avenra.work.api;

import com.avenra.contract.v1.api.WorkApi;
import com.avenra.contract.v1.model.AssignExceptionRequest;
import com.avenra.contract.v1.model.CreateTaskRequest;
import com.avenra.contract.v1.model.CreateWorkRequest;
import com.avenra.contract.v1.model.ExceptionTransitionRequest;
import com.avenra.contract.v1.model.Execution;
import com.avenra.contract.v1.model.Task;
import com.avenra.contract.v1.model.TaskStatusRequest;
import com.avenra.contract.v1.model.TransitionRequest;
import com.avenra.contract.v1.model.UpdateWorkRequest;
import com.avenra.contract.v1.model.WorkDetail;
import com.avenra.contract.v1.model.WorkException;
import com.avenra.contract.v1.model.WorkStatus;
import com.avenra.contract.v1.model.WorkSummary;
import com.avenra.contract.v1.model.WorkTransition;
import com.avenra.platform.security.CurrentUser;
import com.avenra.work.application.ExceptionService;
import com.avenra.work.application.WorkService;
import com.avenra.work.domain.WorkFilter;
import com.avenra.work.infrastructure.ExceptionRepository;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/** Implements the contract's work operations (ADR-008). */
@RestController
class WorkController implements WorkApi {

    private final WorkService work;
    private final ExceptionService exceptions;

    WorkController(WorkService work, ExceptionService exceptions) {
        this.work = work;
        this.exceptions = exceptions;
    }

    @Override
    public ResponseEntity<List<WorkException>> listExceptions(
            UUID organizationId,
            com.avenra.contract.v1.model.@Nullable ExceptionStatus status,
            @Nullable UUID workId,
            @Nullable Boolean open) {
        var filter = new ExceptionRepository.Filter(
                status == null ? null : com.avenra.work.domain.ExceptionStatus.valueOf(status.getValue()),
                workId,
                Boolean.TRUE.equals(open));
        return ResponseEntity.ok(exceptions.list(userId(), organizationId, filter));
    }

    @Override
    public ResponseEntity<WorkException> getException(UUID organizationId, UUID exceptionId) {
        return ResponseEntity.ok(exceptions.get(userId(), organizationId, exceptionId));
    }

    @Override
    public ResponseEntity<WorkException> assignException(
            UUID organizationId, UUID exceptionId, AssignExceptionRequest body) {
        return ResponseEntity.ok(exceptions.assign(userId(), organizationId, exceptionId, body));
    }

    @Override
    public ResponseEntity<WorkException> transitionException(
            UUID organizationId, UUID exceptionId, ExceptionTransitionRequest body) {
        return ResponseEntity.ok(exceptions.transition(userId(), organizationId, exceptionId, body));
    }

    @Override
    public ResponseEntity<List<com.avenra.contract.v1.model.Evidence>> listEvidence(UUID organizationId, UUID workId) {
        return ResponseEntity.ok(work.evidence(userId(), organizationId, workId));
    }

    @Override
    public ResponseEntity<List<com.avenra.contract.v1.model.Evidence>> listOrganizationEvidence(
            UUID organizationId, @Nullable String kind) {
        return ResponseEntity.ok(work.organizationEvidence(userId(), organizationId, kind));
    }

    @Override
    public ResponseEntity<com.avenra.contract.v1.model.CompletionManifest> getCompletion(
            UUID organizationId, UUID workId) {
        return ResponseEntity.ok(work.completion(userId(), organizationId, workId));
    }

    @Override
    public ResponseEntity<List<Execution>> listExecutions(UUID organizationId, UUID workId) {
        return ResponseEntity.ok(work.executions(userId(), organizationId, workId));
    }

    @Override
    public ResponseEntity<List<WorkSummary>> listWork(
            UUID organizationId,
            @Nullable UUID projectId,
            @Nullable UUID clientId,
            @Nullable WorkStatus status,
            @Nullable String q) {
        var filter = new WorkFilter(
                projectId,
                clientId,
                status == null ? null : com.avenra.work.domain.WorkStatus.valueOf(status.getValue()),
                q == null || q.isBlank() ? null : q.strip());
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

    private static UUID userId() {
        return CurrentUser.require().userId();
    }
}
