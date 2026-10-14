package com.avenra.work.application;

import com.avenra.contract.v1.model.Client;
import com.avenra.contract.v1.model.Priority;
import com.avenra.contract.v1.model.Project;
import com.avenra.contract.v1.model.Requirement;
import com.avenra.contract.v1.model.Task;
import com.avenra.contract.v1.model.TaskStatus;
import com.avenra.contract.v1.model.WorkDetail;
import com.avenra.contract.v1.model.WorkSummary;
import com.avenra.contract.v1.model.WorkTransition;
import com.avenra.information.domain.Completeness;
import com.avenra.platform.web.ApiTime;
import com.avenra.work.domain.Progress;
import com.avenra.work.domain.WorkStatus;
import com.avenra.work.infrastructure.ClientRepository.ClientRow;
import com.avenra.work.infrastructure.ClientRepository.ProjectRow;
import com.avenra.work.infrastructure.WorkRepository.TaskRow;
import com.avenra.work.infrastructure.WorkRepository.TransitionRow;
import com.avenra.work.infrastructure.WorkRepository.WorkRow;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.jspecify.annotations.Nullable;

/**
 * Turns work rows into contract models (ADR-008). Requirements and answers come already mapped
 * from the information module.
 */
final class WorkViews {

    private WorkViews() {}

    static WorkDetail detail(
            WorkRow work,
            List<Requirement> requirements,
            Completeness completeness,
            List<TaskRow> tasks,
            long openExceptions,
            @Nullable String lastReason) {
        long openTasks =
                tasks.stream().filter(task -> task.status().equals("OPEN")).count();
        var progress = Progress.of(work.status(), completeness, openTasks, openExceptions, lastReason);
        var detail = new WorkDetail(
                work.id(),
                work.title(),
                status(work.status()),
                Priority.fromValue(work.priority()),
                completeness(completeness),
                utc(work.createdAt()),
                utc(work.updatedAt()),
                work.requestedBy(),
                requirements,
                tasks.stream().map(WorkViews::task).toList(),
                work.status().next().stream()
                        .sorted(Comparator.naturalOrder())
                        .map(WorkViews::status)
                        .toList(),
                new com.avenra.contract.v1.model.Progress(progress.currentStep(), progress.nextAction())
                        .blockedReason(progress.blockedReason())
                        .openExceptions((int) openExceptions)
                        .openTasks((int) openTasks));
        detail.type(work.type())
                .description(work.description())
                .clientId(work.clientId())
                .projectId(work.projectId())
                .ownerMembershipId(work.ownerMembershipId())
                .dueAt(utcOrNull(work.dueAt()))
                .startedAt(utcOrNull(work.startedAt()))
                .completedAt(utcOrNull(work.completedAt()))
                .completionReason(work.completionReason());
        return detail;
    }

    static WorkSummary summary(WorkRow work, Completeness completeness, long openExceptions) {
        return new WorkSummary(
                        work.id(),
                        work.title(),
                        status(work.status()),
                        Priority.fromValue(work.priority()),
                        completeness(completeness),
                        utc(work.createdAt()),
                        utc(work.updatedAt()))
                .type(work.type())
                .clientId(work.clientId())
                .projectId(work.projectId())
                .ownerMembershipId(work.ownerMembershipId())
                .dueAt(utcOrNull(work.dueAt()))
                .openExceptions((int) openExceptions);
    }

    static Task task(TaskRow row) {
        var task = new Task(
                        row.id(),
                        row.title(),
                        Task.KindEnum.fromValue(row.kind()),
                        row.completionCondition(),
                        TaskStatus.fromValue(row.status()),
                        utc(row.createdAt()),
                        Task.OriginEnum.fromValue(row.origin()))
                .requiredAction(row.requiredAction())
                .reason(row.reason())
                .choices(new ArrayList<>(row.choiceList()))
                .assigneeMembershipId(row.assigneeMembershipId())
                .dueAt(utcOrNull(row.dueAt()))
                .note(row.note())
                .completedAt(utcOrNull(row.completedAt()));
        if (row.sourceType() != null && row.sourceId() != null) {
            task.about(new com.avenra.contract.v1.model.Reference(row.sourceType(), row.sourceId()));
        }
        return task;
    }

    static WorkTransition transition(TransitionRow row) {
        return new WorkTransition(row.id(), status(row.toStatus()), utc(row.occurredAt()))
                .from(row.fromStatus() == null ? null : status(row.fromStatus()))
                .actorUserId(row.actorUserId())
                .actorRule(row.actorRule())
                .reason(row.reason());
    }

    static com.avenra.contract.v1.model.Execution execution(
            com.avenra.work.infrastructure.ExecutionRepository.ExecutionRow row) {
        var actor = new com.avenra.contract.v1.model.ExecutionActor(
                        com.avenra.contract.v1.model.ExecutionActor.TypeEnum.fromValue(row.actorType()))
                .userId(row.actorUserId())
                .rule(row.actorRule());
        var execution = new com.avenra.contract.v1.model.Execution(
                        row.id(),
                        actor,
                        row.action(),
                        com.avenra.contract.v1.model.Execution.StatusEnum.fromValue(
                                row.status().name()),
                        row.retryCount(),
                        utc(row.createdAt()))
                .target(row.target())
                .result(new java.util.HashMap<>(row.result()))
                .error(row.error())
                .startedAt(utcOrNull(row.startedAt()))
                .completedAt(utcOrNull(row.completedAt()));
        if (row.stepType() != null && row.stepId() != null) {
            execution.step(new com.avenra.contract.v1.model.Reference(row.stepType(), row.stepId()));
        }
        return execution;
    }

    static Client client(ClientRow row) {
        return new Client(row.id(), row.name(), utc(row.createdAt()), utc(row.updatedAt()))
                .email(row.email())
                .reference(row.reference());
    }

    static Project project(ProjectRow row) {
        return new Project(row.id(), row.name(), utc(row.createdAt()), utc(row.updatedAt()))
                .clientId(row.clientId())
                .description(row.description());
    }

    static com.avenra.contract.v1.model.Completeness completeness(Completeness completeness) {
        return new com.avenra.contract.v1.model.Completeness(
                completeness.required(),
                completeness.accepted(),
                completeness.awaitingReview(),
                completeness.missing(),
                completeness.rejected(),
                completeness.complete());
    }

    static com.avenra.contract.v1.model.WorkStatus status(WorkStatus status) {
        return com.avenra.contract.v1.model.WorkStatus.fromValue(status.name());
    }

    static OffsetDateTime utc(OffsetDateTime time) {
        return ApiTime.utc(time);
    }

    static @Nullable OffsetDateTime utcOrNull(@Nullable OffsetDateTime time) {
        return ApiTime.utcOrNull(time);
    }
}
