package com.avenra.work.infrastructure;

import com.avenra.work.domain.WorkFilter;
import com.avenra.work.domain.WorkStatus;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Work, its status history and its tasks. The status is written only by {@link #changeStatus}. */
@Repository
public class WorkRepository {

    public record WorkRow(
            UUID id,
            UUID organizationId,
            @Nullable UUID clientId,
            @Nullable UUID projectId,
            String title,
            @Nullable String description,
            @Nullable String type,
            String priority,
            WorkStatus status,
            @Nullable UUID ownerMembershipId,
            UUID requestedBy,
            @Nullable OffsetDateTime dueAt,
            @Nullable OffsetDateTime startedAt,
            @Nullable OffsetDateTime completedAt,
            @Nullable String completionReason,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt,
            @Nullable OffsetDateTime overdueFlaggedAt) {}

    public record TransitionRow(
            UUID id,
            @Nullable WorkStatus fromStatus,
            WorkStatus toStatus,
            @Nullable UUID actorUserId,
            @Nullable String actorRule,
            @Nullable String reason,
            OffsetDateTime occurredAt) {}

    public record TaskRow(
            UUID id,
            UUID workId,
            String title,
            String kind,
            String completionCondition,
            String status,
            @Nullable UUID assigneeMembershipId,
            @Nullable OffsetDateTime dueAt,
            @Nullable String note,
            @Nullable OffsetDateTime completedAt,
            OffsetDateTime createdAt,
            String origin,
            @Nullable String requiredAction,
            @Nullable String reason,
            @Nullable String choices,
            @Nullable String sourceType,
            @Nullable UUID sourceId) {

        /** A task the person creates and closes themselves. */
        public static TaskRow manual(
                UUID id,
                UUID workId,
                String title,
                String condition,
                @Nullable UUID assignee,
                @Nullable OffsetDateTime dueAt,
                OffsetDateTime now) {
            return new TaskRow(
                    id, workId, title, "HUMAN", condition, "OPEN", assignee, dueAt, null, null, now, "MANUAL", null,
                    null, null, null, null);
        }

        public java.util.List<String> choiceList() {
            return choices == null || choices.isBlank() ? java.util.List.of() : java.util.List.of(choices.split(","));
        }
    }

    private static final String WORK = "id, organization_id, client_id, project_id, title, description, type, priority,"
            + " status, owner_membership_id, requested_by, due_at, started_at, completed_at, completion_reason,"
            + " created_at, updated_at, overdue_flagged_at";
    private static final String TASK = "id, work_id, title, kind, completion_condition, status, assignee_membership_id,"
            + " due_at, note, completed_at, created_at, origin, required_action, reason,"
            + " array_to_string(choices, ',') as choices, source_type, source_id";
    private static final int LIST_LIMIT = 200;

    private final JdbcClient jdbc;

    WorkRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(WorkRow row) {
        jdbc.sql(
                        "insert into work (" + WORK
                                + ") values (:id, :org, :client, :project, :title, :description, :type,"
                                + " :priority, :status, :owner, :requestedBy, :due, null, null, null, :created, :updated, null)")
                .param("id", row.id())
                .param("org", row.organizationId())
                .param("client", row.clientId())
                .param("project", row.projectId())
                .param("title", row.title())
                .param("description", row.description())
                .param("type", row.type())
                .param("priority", row.priority())
                .param("status", row.status().name())
                .param("owner", row.ownerMembershipId())
                .param("requestedBy", row.requestedBy())
                .param("due", row.dueAt())
                .param("created", row.createdAt())
                .param("updated", row.updatedAt())
                .update();
    }

    public Optional<WorkRow> find(UUID organizationId, UUID id) {
        return jdbc.sql("select " + WORK + " from work where organization_id = :org and id = :id")
                .param("org", organizationId)
                .param("id", id)
                .query(WorkRow.class)
                .optional();
    }

    public Optional<WorkRow> findForUpdate(UUID organizationId, UUID id) {
        return jdbc.sql("select " + WORK + " from work where organization_id = :org and id = :id for update")
                .param("org", organizationId)
                .param("id", id)
                .query(WorkRow.class)
                .optional();
    }

    /** Work visible through the request link the transaction holds (title only is used). */
    public Optional<WorkRow> findForRequestLink(UUID id) {
        return jdbc.sql("select " + WORK + " from work where id = :id")
                .param("id", id)
                .query(WorkRow.class)
                .optional();
    }

    /** Titles of the organization's work, by id; unknown ids are left out. */
    public java.util.Map<UUID, String> titles(UUID organizationId, java.util.Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return java.util.Map.of();
        }
        var titles = new java.util.HashMap<UUID, String>();
        jdbc.sql("select id, title from work where organization_id = :org and id in (:ids)")
                .param("org", organizationId)
                .param("ids", java.util.List.copyOf(ids))
                .query((rs, row) -> titles.put(rs.getObject("id", UUID.class), rs.getString("title")))
                .list();
        return titles;
    }

    public List<WorkRow> list(UUID organizationId, WorkFilter filter) {
        return jdbc.sql("select " + WORK + """
                         from work
                        where organization_id = :org
                          and (cast(:project as uuid) is null or project_id = :project)
                          and (cast(:client as uuid) is null or client_id = :client)
                          and (cast(:status as text) is null or status = :status)
                          and (cast(:q as text) is null or position(lower(:q) in lower(title)) > 0)
                        order by updated_at desc, id
                        limit :limit
                        """)
                .param("org", organizationId)
                .param("project", filter.projectId())
                .param("client", filter.clientId())
                .param(
                        "status",
                        filter.status() == null ? null : filter.status().name())
                .param("q", filter.titleContains())
                .param("limit", LIST_LIMIT)
                .query(WorkRow.class)
                .list();
    }

    public void updateDetails(WorkRow row, OffsetDateTime now) {
        jdbc.sql("""
                        update work set title = :title, description = :description, type = :type, priority = :priority,
                                        due_at = :due, owner_membership_id = :owner, updated_at = :now,
                                        -- a new due date can become overdue again
                                        overdue_flagged_at = case when due_at is distinct from :due then null
                                                                  else overdue_flagged_at end
                        where organization_id = :org and id = :id
                        """)
                .param("org", row.organizationId())
                .param("id", row.id())
                .param("title", row.title())
                .param("description", row.description())
                .param("type", row.type())
                .param("priority", row.priority())
                .param("due", row.dueAt())
                .param("owner", row.ownerMembershipId())
                .param("now", now)
                .update();
    }

    /** The only status write; callers check the transition first (ADR-018). */
    public void changeStatus(
            UUID organizationId,
            UUID id,
            WorkStatus status,
            @Nullable OffsetDateTime startedAt,
            @Nullable OffsetDateTime completedAt,
            @Nullable String completionReason,
            OffsetDateTime now) {
        jdbc.sql("""
                        update work set status = :status, started_at = :started, completed_at = :completed,
                                        completion_reason = :reason, updated_at = :now
                        where organization_id = :org and id = :id
                        """)
                .param("org", organizationId)
                .param("id", id)
                .param("status", status.name())
                .param("started", startedAt)
                .param("completed", completedAt)
                .param("reason", completionReason)
                .param("now", now)
                .update();
    }

    public void touch(UUID organizationId, UUID id, OffsetDateTime now) {
        jdbc.sql("update work set updated_at = :now where organization_id = :org and id = :id")
                .param("org", organizationId)
                .param("id", id)
                .param("now", now)
                .update();
    }

    public void insertTransition(UUID organizationId, UUID workId, TransitionRow row) {
        jdbc.sql("""
                        insert into work_transitions (id, organization_id, work_id, from_status, to_status, actor_user_id,
                                                      actor_rule, reason, occurred_at)
                        values (:id, :org, :work, :from, :to, :actor, :rule, :reason, :at)
                        """)
                .param("id", row.id())
                .param("org", organizationId)
                .param("work", workId)
                .param(
                        "from",
                        row.fromStatus() == null ? null : row.fromStatus().name())
                .param("to", row.toStatus().name())
                .param("actor", row.actorUserId())
                .param("rule", row.actorRule())
                .param("reason", row.reason())
                .param("at", row.occurredAt())
                .update();
    }

    public List<TransitionRow> transitions(UUID organizationId, UUID workId) {
        return jdbc.sql("""
                        select id, from_status, to_status, actor_user_id, actor_rule, reason, occurred_at
                        from work_transitions
                        where organization_id = :org and work_id = :work
                        order by occurred_at, id
                        """)
                .param("org", organizationId)
                .param("work", workId)
                .query(TransitionRow.class)
                .list();
    }

    public void insertTask(UUID organizationId, TaskRow row, UUID createdBy) {
        jdbc.sql("""
                        insert into tasks (id, organization_id, work_id, title, kind, completion_condition, status,
                                           assignee_membership_id, due_at, created_by, created_at, updated_at)
                        values (:id, :org, :work, :title, :kind, :condition, :status, :assignee, :due, :by, :created,
                                :created)
                        """)
                .param("id", row.id())
                .param("org", organizationId)
                .param("work", row.workId())
                .param("title", row.title())
                .param("kind", row.kind())
                .param("condition", row.completionCondition())
                .param("status", row.status())
                .param("assignee", row.assigneeMembershipId())
                .param("due", row.dueAt())
                .param("by", createdBy)
                .param("created", row.createdAt())
                .update();
    }

    public List<TaskRow> tasks(UUID organizationId, UUID workId) {
        return jdbc.sql("select " + TASK + " from tasks where organization_id = :org and work_id = :work"
                        + " order by created_at, id")
                .param("org", organizationId)
                .param("work", workId)
                .query(TaskRow.class)
                .list();
    }

    public Optional<TaskRow> findTaskForUpdate(UUID organizationId, UUID workId, UUID taskId) {
        return jdbc.sql("select " + TASK + " from tasks where organization_id = :org and work_id = :work and id = :id"
                        + " for update")
                .param("org", organizationId)
                .param("work", workId)
                .param("id", taskId)
                .query(TaskRow.class)
                .optional();
    }

    /**
     * Opens a system task (ADR-024) unless one is already open for the same source.
     *
     * @return whether a task was created
     */
    public boolean openSystemTask(UUID organizationId, TaskRow row) {
        return jdbc.sql("""
                                insert into tasks (id, organization_id, work_id, title, kind, completion_condition, status,
                                                   assignee_membership_id, due_at, origin, required_action, reason,
                                                   choices, source_type, source_id, created_at, updated_at)
                                values (:id, :org, :work, :title, 'HUMAN', :condition, 'OPEN', :assignee, :due, 'SYSTEM',
                                        :action, :reason, string_to_array(:choices, ','), :sourceType, :sourceId,
                                        :created, :created)
                                on conflict (organization_id, source_type, source_id)
                                    where origin = 'SYSTEM' and status = 'OPEN'
                                do nothing
                                """)
                        .param("id", row.id())
                        .param("org", organizationId)
                        .param("work", row.workId())
                        .param("title", row.title())
                        .param("condition", row.completionCondition())
                        .param("assignee", row.assigneeMembershipId())
                        .param("due", row.dueAt())
                        .param("action", row.requiredAction())
                        .param("reason", row.reason())
                        .param("choices", row.choices())
                        .param("sourceType", row.sourceType())
                        .param("sourceId", row.sourceId())
                        .param("created", row.createdAt())
                        .update()
                > 0;
    }

    /** Closes the open system task about a source, recording what closed it. */
    public void closeSystemTask(
            UUID organizationId,
            String sourceType,
            UUID sourceId,
            String status,
            String note,
            @Nullable UUID by,
            OffsetDateTime now) {
        jdbc.sql("""
                        update tasks set status = :status, note = :note, completed_at = :now, completed_by = :by,
                                         updated_at = :now
                        where organization_id = :org and origin = 'SYSTEM' and status = 'OPEN'
                          and source_type = :sourceType and source_id = :sourceId
                        """)
                .param("org", organizationId)
                .param("sourceType", sourceType)
                .param("sourceId", sourceId)
                .param("status", status)
                .param("note", note)
                .param("by", by)
                .param("now", now)
                .update();
    }

    /** Cancels the open system tasks of work that was cancelled or failed. */
    public void cancelSystemTasks(
            UUID organizationId, UUID workId, String note, @Nullable UUID by, OffsetDateTime now) {
        jdbc.sql("""
                        update tasks set status = 'CANCELLED', note = :note, completed_at = :now, completed_by = :by,
                                         updated_at = :now
                        where organization_id = :org and work_id = :work and origin = 'SYSTEM' and status = 'OPEN'
                        """)
                .param("org", organizationId)
                .param("work", workId)
                .param("note", note)
                .param("by", by)
                .param("now", now)
                .update();
    }

    /** The reason given for the latest transition into the current status, for the blocked reason. */
    public Optional<String> lastReason(UUID organizationId, UUID workId) {
        return jdbc.sql("""
                        select reason from work_transitions where organization_id = :org and work_id = :work
                        order by occurred_at desc, id desc limit 1
                        """)
                .param("org", organizationId)
                .param("work", workId)
                .query(String.class)
                .optional();
    }

    public void markOverdue(UUID organizationId, UUID workId, OffsetDateTime now) {
        jdbc.sql("update work set overdue_flagged_at = :now where organization_id = :org and id = :id")
                .param("org", organizationId)
                .param("id", workId)
                .param("now", now)
                .update();
    }

    public void finishTask(
            UUID organizationId, UUID taskId, String status, @Nullable String note, UUID by, OffsetDateTime now) {
        jdbc.sql("""
                        update tasks set status = :status, note = :note, completed_at = :now, completed_by = :by,
                                         updated_at = :now
                        where organization_id = :org and id = :id and status = 'OPEN'
                        """)
                .param("org", organizationId)
                .param("id", taskId)
                .param("status", status)
                .param("note", note)
                .param("by", by)
                .param("now", now)
                .update();
    }

    public long openTasks(UUID organizationId, UUID workId) {
        return jdbc.sql(
                        "select count(*) from tasks where organization_id = :org and work_id = :work and status = 'OPEN'")
                .param("org", organizationId)
                .param("work", workId)
                .query(Long.class)
                .single();
    }
}
