package com.avenra.work.application;

import com.avenra.contract.v1.model.Client;
import com.avenra.contract.v1.model.DocumentVersion;
import com.avenra.contract.v1.model.InformationItem;
import com.avenra.contract.v1.model.InformationSource;
import com.avenra.contract.v1.model.Priority;
import com.avenra.contract.v1.model.Project;
import com.avenra.contract.v1.model.RequestLink;
import com.avenra.contract.v1.model.Requirement;
import com.avenra.contract.v1.model.RequirementState;
import com.avenra.contract.v1.model.Task;
import com.avenra.contract.v1.model.TaskStatus;
import com.avenra.contract.v1.model.Verification;
import com.avenra.contract.v1.model.VerificationState;
import com.avenra.contract.v1.model.WorkDetail;
import com.avenra.contract.v1.model.WorkSummary;
import com.avenra.contract.v1.model.WorkTransition;
import com.avenra.document.Documents;
import com.avenra.work.domain.Completeness;
import com.avenra.work.domain.Progress;
import com.avenra.work.domain.WorkStatus;
import com.avenra.work.infrastructure.ClientRepository.ClientRow;
import com.avenra.work.infrastructure.ClientRepository.ProjectRow;
import com.avenra.work.infrastructure.RequestLinkRepository.LinkRow;
import com.avenra.work.infrastructure.RequirementRepository;
import com.avenra.work.infrastructure.RequirementRepository.ItemRow;
import com.avenra.work.infrastructure.RequirementRepository.RequirementRow;
import com.avenra.work.infrastructure.WorkRepository.TaskRow;
import com.avenra.work.infrastructure.WorkRepository.TransitionRow;
import com.avenra.work.infrastructure.WorkRepository.WorkRow;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;

/**
 * Turns stored rows into contract models (ADR-008). Reads what it needs inside the caller's tenant
 * transaction; never decides access.
 */
@Component
class WorkViews {

    private final RequirementRepository requirements;
    private final Documents documents;

    WorkViews(RequirementRepository requirements, Documents documents) {
        this.requirements = requirements;
        this.documents = documents;
    }

    /** Requirement rows with their current items and documents. */
    record LoadedRequirements(
            List<RequirementRow> rows, Map<UUID, ItemRow> currentItems, Map<String, Documents.StoredVersion> versions) {

        @Nullable
        ItemRow current(RequirementRow row) {
            return row.currentItemId() == null ? null : currentItems.get(row.currentItemId());
        }

        Completeness.RequirementState state(RequirementRow row) {
            ItemRow item = current(row);
            return Completeness.RequirementState.of(item == null ? null : item.verificationState());
        }

        Completeness completeness() {
            return Completeness.of(rows.stream()
                    .map(row -> new Completeness.Entry(row.required(), state(row)))
                    .toList());
        }
    }

    LoadedRequirements load(List<RequirementRow> rows) {
        var itemIds = rows.stream()
                .map(RequirementRow::currentItemId)
                .filter(Objects::nonNull)
                .toList();
        var items =
                requirements.itemsByIds(itemIds).stream().collect(Collectors.toMap(ItemRow::id, Function.identity()));
        return new LoadedRequirements(rows, items, versionsOf(items.values()));
    }

    Map<String, Documents.StoredVersion> versionsOf(Collection<ItemRow> items) {
        var documentIds = items.stream()
                .map(ItemRow::documentId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<String, Documents.StoredVersion> versions = new HashMap<>();
        for (var version : documents.versions(documentIds)) {
            versions.put(key(version.documentId(), version.version()), version);
        }
        return versions;
    }

    WorkDetail detail(
            WorkRow work,
            List<RequirementRow> requirementRows,
            List<TaskRow> tasks,
            long openExceptions,
            @Nullable String lastReason) {
        var loaded = load(requirementRows);
        long openTasks =
                tasks.stream().filter(task -> task.status().equals("OPEN")).count();
        var progress = Progress.of(work.status(), loaded.completeness(), openTasks, openExceptions, lastReason);
        var detail = new WorkDetail(
                work.id(),
                work.title(),
                status(work.status()),
                Priority.fromValue(work.priority()),
                completeness(loaded.completeness()),
                utc(work.createdAt()),
                utc(work.updatedAt()),
                work.requestedBy(),
                requirementRows.stream().map(row -> requirement(row, loaded)).toList(),
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

    Requirement requirement(RequirementRow row, LoadedRequirements loaded) {
        var requirement = new Requirement(
                        row.id(),
                        row.title(),
                        kind(row),
                        row.required(),
                        RequirementState.fromValue(loaded.state(row).name()),
                        utc(row.createdAt()))
                .instructions(row.instructions());
        ItemRow current = loaded.current(row);
        if (current != null) {
            requirement.currentItem(item(current, loaded.versions()));
        }
        return requirement;
    }

    static InformationItem item(ItemRow row, Map<String, Documents.StoredVersion> versions) {
        var source = new InformationSource(InformationSource.TypeEnum.fromValue(row.sourceType()))
                .userId(row.sourceUserId())
                .requestLinkId(row.sourceLinkId());
        var verification = new Verification(
                        VerificationState.fromValue(row.verificationState().name()))
                .reviewedByUserId(row.reviewedBy())
                .reviewedAt(utcOrNull(row.reviewedAt()))
                .reason(row.reviewReason());
        var item = new InformationItem(
                        row.id(),
                        row.requirementId(),
                        com.avenra.contract.v1.model.RequirementKind.fromValue(
                                row.kind().name()),
                        source,
                        utc(row.receivedAt()),
                        verification)
                .value(row.valueText())
                .confidence(row.confidence());
        if (row.documentId() != null && row.documentVersion() != null) {
            var version = versions.get(key(row.documentId(), row.documentVersion()));
            if (version != null) {
                item.document(document(version));
            }
        }
        return item;
    }

    static DocumentVersion document(Documents.StoredVersion version) {
        return new DocumentVersion(
                version.documentId(),
                version.version(),
                version.fileName(),
                version.contentType(),
                version.sizeBytes(),
                version.sha256Hex(),
                version.clean() ? DocumentVersion.ScanStatusEnum.CLEAN : DocumentVersion.ScanStatusEnum.INFECTED,
                utc(version.uploadedAt()));
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

    static RequestLink link(LinkRow row, List<UUID> requirementIds, OffsetDateTime now) {
        RequestLink.StatusEnum status = row.revokedAt() != null
                ? RequestLink.StatusEnum.REVOKED
                : row.expiresAt().isAfter(now) ? RequestLink.StatusEnum.ACTIVE : RequestLink.StatusEnum.EXPIRED;
        return new RequestLink(
                        row.id(),
                        row.recipientEmail(),
                        new ArrayList<>(requirementIds),
                        status,
                        utc(row.createdAt()),
                        utc(row.expiresAt()),
                        row.remindersSent())
                .lastRemindedAt(utcOrNull(row.lastRemindedAt()))
                .recipientName(row.recipientName())
                .message(row.message())
                .createdByUserId(row.createdBy())
                .lastOpenedAt(utcOrNull(row.lastOpenedAt()))
                .revokedAt(utcOrNull(row.revokedAt()));
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

    static com.avenra.contract.v1.model.RequirementKind kind(RequirementRow row) {
        return com.avenra.contract.v1.model.RequirementKind.fromValue(row.kind().name());
    }

    static String key(UUID documentId, int version) {
        return documentId + "/" + version;
    }

    static OffsetDateTime utc(OffsetDateTime time) {
        return time.withOffsetSameInstant(ZoneOffset.UTC);
    }

    static @Nullable OffsetDateTime utcOrNull(@Nullable OffsetDateTime time) {
        return time == null ? null : utc(time);
    }
}
