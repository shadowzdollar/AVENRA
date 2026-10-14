package com.avenra.work.application;

import com.avenra.audit.AuditLog;
import com.avenra.contract.v1.model.CreateRequirementRequest;
import com.avenra.contract.v1.model.CreateTaskRequest;
import com.avenra.contract.v1.model.CreateWorkRequest;
import com.avenra.contract.v1.model.Requirement;
import com.avenra.contract.v1.model.Task;
import com.avenra.contract.v1.model.TaskStatusRequest;
import com.avenra.contract.v1.model.TransitionRequest;
import com.avenra.contract.v1.model.UpdateWorkRequest;
import com.avenra.contract.v1.model.WorkDetail;
import com.avenra.contract.v1.model.WorkSummary;
import com.avenra.contract.v1.model.WorkTransition;
import com.avenra.organization.OrganizationAccess;
import com.avenra.organization.domain.Permission;
import com.avenra.platform.idempotency.Idempotency;
import com.avenra.platform.web.ApiException;
import com.avenra.work.domain.Completeness;
import com.avenra.work.domain.RequirementKind;
import com.avenra.work.domain.WorkFilter;
import com.avenra.work.domain.WorkStatus;
import com.avenra.work.infrastructure.ExceptionRepository;
import com.avenra.work.infrastructure.RequirementRepository;
import com.avenra.work.infrastructure.RequirementRepository.RequirementRow;
import com.avenra.work.infrastructure.WorkRepository;
import com.avenra.work.infrastructure.WorkRepository.TaskRow;
import com.avenra.work.infrastructure.WorkRepository.TransitionRow;
import com.avenra.work.infrastructure.WorkRepository.WorkRow;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Work, its lifecycle (ADR-018), its tasks and its requirements. People change the status in
 * {@link #transition}; every change goes through {@link WorkLifecycle}.
 */
@Service
public class WorkService {

    private final WorkRepository work;
    private final RequirementRepository requirements;
    private final ClientService clients;
    private final WorkViews views;
    private final WorkLifecycle lifecycle;
    private final ExceptionRepository exceptions;
    private final com.avenra.work.infrastructure.ExecutionRepository executionRows;
    private final OrganizationAccess access;
    private final Idempotency idempotency;
    private final AuditLog audit;
    private final Clock clock;

    WorkService(
            WorkRepository work,
            RequirementRepository requirements,
            ClientService clients,
            WorkViews views,
            WorkLifecycle lifecycle,
            ExceptionRepository exceptions,
            com.avenra.work.infrastructure.ExecutionRepository executionRows,
            OrganizationAccess access,
            Idempotency idempotency,
            AuditLog audit,
            Clock clock) {
        this.work = work;
        this.requirements = requirements;
        this.clients = clients;
        this.views = views;
        this.lifecycle = lifecycle;
        this.exceptions = exceptions;
        this.executionRows = executionRows;
        this.access = access;
        this.idempotency = idempotency;
        this.audit = audit;
        this.clock = clock;
    }

    public List<WorkSummary> list(UUID userId, UUID organizationId, WorkFilter filter) {
        return access.run(userId, organizationId, Permission.WORK_READ, granted -> {
            var rows = work.list(organizationId, filter);
            var states = requirements
                    .states(organizationId, rows.stream().map(WorkRow::id).toList())
                    .stream()
                    .collect(Collectors.groupingBy(
                            RequirementRepository.RequirementStateRow::workId,
                            Collectors.mapping(
                                    state -> new Completeness.Entry(
                                            state.required(),
                                            Completeness.RequirementState.of(state.verificationState())),
                                    Collectors.toList())));
            var open = exceptions.openByWork(
                    organizationId, rows.stream().map(WorkRow::id).toList());
            return rows.stream()
                    .map(row -> WorkViews.summary(
                            row,
                            Completeness.of(states.getOrDefault(row.id(), List.of())),
                            open.getOrDefault(row.id(), 0L)))
                    .toList();
        });
    }

    public WorkDetail get(UUID userId, UUID organizationId, UUID workId) {
        return access.run(
                userId, organizationId, Permission.WORK_READ, granted -> detail(find(organizationId, workId)));
    }

    public WorkDetail create(UUID userId, UUID organizationId, String idempotencyKey, CreateWorkRequest input) {
        String title = Text.required(input.getTitle(), "title");
        String description = Text.optional(input.getDescription());
        String type = Text.optional(input.getType());
        String priority =
                input.getPriority() == null ? "NORMAL" : input.getPriority().getValue();
        return access.run(
                userId,
                organizationId,
                Permission.WORK_CREATE,
                granted -> idempotency.once(
                        userId,
                        "createWork",
                        idempotencyKey,
                        Text.fingerprint(
                                organizationId,
                                title,
                                description,
                                type,
                                priority,
                                input.getClientId(),
                                input.getProjectId(),
                                input.getDueAt(),
                                input.getOwnerMembershipId()),
                        WorkDetail.class,
                        () -> {
                            clients.requireClient(organizationId, input.getClientId());
                            clients.requireProject(organizationId, input.getProjectId(), input.getClientId());
                            UUID owner = input.getOwnerMembershipId() == null
                                    ? granted.membershipId()
                                    : requireMember(organizationId, input.getOwnerMembershipId(), "ownerMembershipId");
                            OffsetDateTime now = OffsetDateTime.now(clock);
                            var row = new WorkRow(
                                    UUID.randomUUID(),
                                    organizationId,
                                    input.getClientId(),
                                    input.getProjectId(),
                                    title,
                                    description,
                                    type,
                                    priority,
                                    WorkStatus.DRAFT,
                                    owner,
                                    userId,
                                    input.getDueAt(),
                                    null,
                                    null,
                                    null,
                                    now,
                                    now,
                                    null);
                            work.insert(row);
                            work.insertTransition(
                                    organizationId,
                                    row.id(),
                                    new TransitionRow(
                                            UUID.randomUUID(), null, WorkStatus.DRAFT, userId, null, null, now));
                            audit.record(AuditLog.Event.of("work.created", organizationId, userId)
                                    .resource("work", row.id()));
                            return detail(row);
                        }));
    }

    public WorkDetail update(UUID userId, UUID organizationId, UUID workId, UpdateWorkRequest input) {
        return access.run(userId, organizationId, Permission.WORK_UPDATE, granted -> {
            WorkRow current = openForUpdate(organizationId, workId);
            UUID owner = input.getOwnerMembershipId() == null
                    ? current.ownerMembershipId()
                    : requireMember(organizationId, input.getOwnerMembershipId(), "ownerMembershipId");
            var updated = new WorkRow(
                    current.id(),
                    organizationId,
                    current.clientId(),
                    current.projectId(),
                    input.getTitle() == null ? current.title() : Text.required(input.getTitle(), "title"),
                    input.getDescription() == null ? current.description() : Text.optional(input.getDescription()),
                    input.getType() == null ? current.type() : Text.optional(input.getType()),
                    input.getPriority() == null
                            ? current.priority()
                            : input.getPriority().getValue(),
                    current.status(),
                    owner,
                    current.requestedBy(),
                    input.getDueAt() == null ? current.dueAt() : input.getDueAt(),
                    current.startedAt(),
                    current.completedAt(),
                    current.completionReason(),
                    current.createdAt(),
                    current.overdueFlaggedAt(),
                    current.updatedAt());
            OffsetDateTime now = OffsetDateTime.now(clock);
            work.updateDetails(updated, now);
            audit.record(
                    AuditLog.Event.of("work.updated", organizationId, userId).resource("work", workId));
            return detail(find(organizationId, workId));
        });
    }

    public WorkDetail transition(UUID userId, UUID organizationId, UUID workId, TransitionRequest input) {
        WorkStatus target = WorkStatus.valueOf(input.getTo().getValue());
        WorkStatus expected = WorkStatus.valueOf(input.getExpectedStatus().getValue());
        String reason = Text.optional(input.getReason());
        return access.run(userId, organizationId, Permission.WORK_UPDATE, granted -> {
            WorkRow current = work.findForUpdate(organizationId, workId).orElseThrow(ApiException::notFound);
            if (current.status() == target && expected != target && lastTransitionMatches(current, expected, target)) {
                // A repeat of the transition that just happened: nothing changes (idempotent).
                return detail(current);
            }
            if (current.status() != expected) {
                throw ApiException.conflict(
                        "STATUS_CHANGED", "The work changed status meanwhile. Reload it and try again.");
            }
            lifecycle.move(current, target, reason, WorkLifecycle.Actor.user(userId));
            return detail(find(organizationId, workId));
        });
    }

    public List<com.avenra.contract.v1.model.Execution> executions(UUID userId, UUID organizationId, UUID workId) {
        return access.run(userId, organizationId, Permission.WORK_READ, granted -> {
            find(organizationId, workId);
            return executionRows.forWork(organizationId, workId).stream()
                    .map(WorkViews::execution)
                    .toList();
        });
    }

    public List<WorkTransition> history(UUID userId, UUID organizationId, UUID workId) {
        return access.run(userId, organizationId, Permission.WORK_READ, granted -> {
            find(organizationId, workId);
            return work.transitions(organizationId, workId).stream()
                    .map(WorkViews::transition)
                    .toList();
        });
    }

    public Task createTask(
            UUID userId, UUID organizationId, UUID workId, String idempotencyKey, CreateTaskRequest input) {
        String title = Text.required(input.getTitle(), "title");
        String condition = Text.required(input.getCompletionCondition(), "completionCondition");
        return access.run(
                userId,
                organizationId,
                Permission.WORK_UPDATE,
                granted -> idempotency.once(
                        userId,
                        "createTask",
                        idempotencyKey,
                        Text.fingerprint(
                                organizationId,
                                workId,
                                title,
                                condition,
                                input.getAssigneeMembershipId(),
                                input.getDueAt()),
                        Task.class,
                        () -> {
                            openForUpdate(organizationId, workId);
                            UUID assignee = input.getAssigneeMembershipId() == null
                                    ? null
                                    : requireMember(
                                            organizationId, input.getAssigneeMembershipId(), "assigneeMembershipId");
                            OffsetDateTime now = OffsetDateTime.now(clock);
                            var row = TaskRow.manual(
                                    UUID.randomUUID(), workId, title, condition, assignee, input.getDueAt(), now);
                            work.insertTask(organizationId, row, userId);
                            work.touch(organizationId, workId, now);
                            audit.record(AuditLog.Event.of("work.task.created", organizationId, userId)
                                    .resource("task", row.id())
                                    .detail("workId", workId.toString()));
                            return WorkViews.task(row);
                        }));
    }

    public Task setTaskStatus(UUID userId, UUID organizationId, UUID workId, UUID taskId, TaskStatusRequest input) {
        String status = input.getStatus().getValue();
        String note = Text.optional(input.getNote());
        return access.run(userId, organizationId, Permission.WORK_EXECUTE, granted -> {
            openForUpdate(organizationId, workId);
            TaskRow task =
                    work.findTaskForUpdate(organizationId, workId, taskId).orElseThrow(ApiException::notFound);
            if (task.status().equals(status)) {
                return WorkViews.task(task);
            }
            if (task.origin().equals("SYSTEM")) {
                throw ApiException.conflict(
                        "TASK_SYSTEM_MANAGED",
                        "This task closes itself when its action is done: " + task.requiredAction());
            }
            if (!task.status().equals("OPEN")) {
                throw ApiException.conflict("TASK_CLOSED", "This task is already " + task.status() + ".");
            }
            OffsetDateTime now = OffsetDateTime.now(clock);
            work.finishTask(organizationId, taskId, status, note, userId, now);
            work.touch(organizationId, workId, now);
            audit.record(
                    AuditLog.Event.of("work.task." + status.toLowerCase(java.util.Locale.ROOT), organizationId, userId)
                            .resource("task", taskId)
                            .detail("workId", workId.toString()));
            return WorkViews.task(
                    work.findTaskForUpdate(organizationId, workId, taskId).orElseThrow());
        });
    }

    public Requirement createRequirement(
            UUID userId, UUID organizationId, UUID workId, String idempotencyKey, CreateRequirementRequest input) {
        String title = Text.required(input.getTitle(), "title");
        String instructions = Text.optional(input.getInstructions());
        RequirementKind kind = RequirementKind.valueOf(input.getKind().getValue());
        boolean required = Boolean.TRUE.equals(input.getRequired());
        return access.run(
                userId,
                organizationId,
                Permission.WORK_UPDATE,
                granted -> idempotency.once(
                        userId,
                        "createRequirement",
                        idempotencyKey,
                        Text.fingerprint(organizationId, workId, title, instructions, kind, required),
                        Requirement.class,
                        () -> {
                            openForUpdate(organizationId, workId);
                            OffsetDateTime now = OffsetDateTime.now(clock);
                            var row = new RequirementRow(
                                    UUID.randomUUID(),
                                    organizationId,
                                    workId,
                                    title,
                                    instructions,
                                    kind,
                                    required,
                                    null,
                                    now);
                            requirements.insert(row, userId);
                            work.touch(organizationId, workId, now);
                            audit.record(AuditLog.Event.of("work.requirement.created", organizationId, userId)
                                    .resource("requirement", row.id())
                                    .detail("workId", workId.toString()));
                            return views.requirement(row, views.load(List.of(row)));
                        }));
    }

    /** Work that is still open, locked for a change. Final work cannot change (ADR-018). */
    WorkRow openForUpdate(UUID organizationId, UUID workId) {
        WorkRow row = work.findForUpdate(organizationId, workId).orElseThrow(ApiException::notFound);
        if (row.status().isFinal()) {
            throw closed();
        }
        return row;
    }

    static ApiException closed() {
        return new ApiException("WORK_CLOSED", HttpStatus.CONFLICT, "This work is finished and can no longer change.");
    }

    private boolean lastTransitionMatches(WorkRow current, WorkStatus from, WorkStatus to) {
        var history = work.transitions(current.organizationId(), current.id());
        if (history.isEmpty()) {
            return false;
        }
        var last = history.getLast();
        return last.fromStatus() == from && last.toStatus() == to;
    }

    private UUID requireMember(UUID organizationId, UUID membershipId, String field) {
        if (!access.isMembership(organizationId, membershipId)) {
            throw ApiException.invalid(field, "is not a member of this organization");
        }
        return membershipId;
    }

    private WorkRow find(UUID organizationId, UUID workId) {
        return work.find(organizationId, workId).orElseThrow(ApiException::notFound);
    }

    private WorkDetail detail(WorkRow row) {
        return views.detail(
                row,
                requirements.forWork(row.organizationId(), row.id()),
                work.tasks(row.organizationId(), row.id()),
                exceptions.openForWork(row.organizationId(), row.id()),
                work.lastReason(row.organizationId(), row.id()).orElse(null));
    }
}
