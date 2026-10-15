package com.avenra.information.infrastructure;

import com.avenra.information.domain.Completeness.VerificationState;
import com.avenra.information.domain.RequirementKind;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * Requirements and the information items submitted for them. Items are only inserted; afterwards
 * only their review columns can change (the database enforces this, see V4).
 */
@Repository
public class RequirementRepository {

    public record RequirementRow(
            UUID id,
            UUID organizationId,
            UUID workId,
            String title,
            @Nullable String instructions,
            RequirementKind kind,
            boolean required,
            @Nullable UUID currentItemId,
            OffsetDateTime createdAt,
            String acceptance,
            String risk,
            int rulesVersion) {

        /** A new requirement: decided by people, normal risk, no rules yet. */
        public static RequirementRow create(
                UUID id,
                UUID organizationId,
                UUID workId,
                String title,
                @Nullable String instructions,
                RequirementKind kind,
                boolean required,
                String acceptance,
                String risk,
                OffsetDateTime now) {
            return new RequirementRow(
                    id, organizationId, workId, title, instructions, kind, required, null, now, acceptance, risk, 0);
        }

        public boolean automatic() {
            return acceptance.equals("AUTOMATIC") && risk.equals("NORMAL");
        }
    }

    public record ItemRow(
            UUID id,
            UUID organizationId,
            UUID requirementId,
            RequirementKind kind,
            @Nullable String valueText,
            @Nullable UUID documentId,
            @Nullable Integer documentVersion,
            String sourceType,
            @Nullable UUID sourceUserId,
            @Nullable UUID sourceLinkId,
            OffsetDateTime receivedAt,
            @Nullable BigDecimal confidence,
            VerificationState verificationState,
            @Nullable UUID reviewedBy,
            @Nullable OffsetDateTime reviewedAt,
            @Nullable String reviewReason,
            @Nullable String decidedBy,
            @Nullable String overrideReason) {}

    /** A requirement with the verification state of its current item, for completeness. */
    public record RequirementStateRow(
            UUID workId, boolean required, @Nullable VerificationState verificationState) {}

    private static final String REQUIREMENT =
            "id, organization_id, work_id, title, instructions, kind, required, current_item_id, created_at, acceptance,"
                    + " risk, rules_version";
    private static final String ITEM = "id, organization_id, requirement_id, kind, value_text, document_id,"
            + " document_version, source_type, source_user_id, source_link_id, received_at, confidence,"
            + " verification_state, reviewed_by, reviewed_at, review_reason, decided_by, override_reason";

    private final JdbcClient jdbc;

    RequirementRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(RequirementRow row, UUID createdBy) {
        jdbc.sql("""
                        insert into requirements (id, organization_id, work_id, title, instructions, kind, required,
                                                  acceptance, risk, rules_version, created_by, created_at, updated_at)
                        values (:id, :org, :work, :title, :instructions, :kind, :required, :acceptance, :risk, 0, :by,
                                :created, :created)
                        """)
                .param("id", row.id())
                .param("org", row.organizationId())
                .param("work", row.workId())
                .param("title", row.title())
                .param("instructions", row.instructions())
                .param("kind", row.kind().name())
                .param("required", row.required())
                .param("acceptance", row.acceptance())
                .param("risk", row.risk())
                .param("by", createdBy)
                .param("created", row.createdAt())
                .update();
    }

    public List<RequirementRow> forWork(UUID organizationId, UUID workId) {
        return jdbc.sql("select " + REQUIREMENT + " from requirements where organization_id = :org and work_id = :work"
                        + " order by created_at, id")
                .param("org", organizationId)
                .param("work", workId)
                .query(RequirementRow.class)
                .list();
    }

    public Optional<RequirementRow> find(UUID requirementId) {
        return jdbc.sql("select " + REQUIREMENT + " from requirements where id = :id")
                .param("id", requirementId)
                .query(RequirementRow.class)
                .optional();
    }

    /** Requirements visible through the request link the transaction holds. */
    public List<RequirementRow> byIds(Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        return jdbc.sql("select " + REQUIREMENT + " from requirements where id in (:ids) order by created_at, id")
                .param("ids", ids)
                .query(RequirementRow.class)
                .list();
    }

    /** Locks the requirement: submissions, uploads and reviews of one requirement run one at a time. */
    public Optional<RequirementRow> findForUpdate(UUID workId, UUID requirementId) {
        return jdbc.sql("select " + REQUIREMENT + " from requirements where work_id = :work and id = :id for update")
                .param("work", workId)
                .param("id", requirementId)
                .query(RequirementRow.class)
                .optional();
    }

    public List<RequirementStateRow> states(UUID organizationId, Collection<UUID> workIds) {
        if (workIds.isEmpty()) {
            return List.of();
        }
        return jdbc.sql("""
                        select r.work_id, r.required, i.verification_state
                        from requirements r
                        left join information_items i on i.organization_id = r.organization_id and i.id = r.current_item_id
                        where r.organization_id = :org and r.work_id in (:works)
                        """)
                .param("org", organizationId)
                .param("works", workIds)
                .query(RequirementStateRow.class)
                .list();
    }

    public void insertItem(ItemRow row) {
        jdbc.sql("insert into information_items (" + ITEM + ") values (:id, :org, :requirement, :kind, :value,"
                        + " :document, :version, :sourceType, :sourceUser, :sourceLink, :received, :confidence, :state,"
                        + " null, null, null, null, null)")
                .param("id", row.id())
                .param("org", row.organizationId())
                .param("requirement", row.requirementId())
                .param("kind", row.kind().name())
                .param("value", row.valueText())
                .param("document", row.documentId())
                .param("version", row.documentVersion())
                .param("sourceType", row.sourceType())
                .param("sourceUser", row.sourceUserId())
                .param("sourceLink", row.sourceLinkId())
                .param("received", row.receivedAt())
                .param("confidence", row.confidence())
                .param("state", row.verificationState().name())
                .update();
    }

    public void setCurrentItem(UUID requirementId, UUID itemId, OffsetDateTime now) {
        jdbc.sql("update requirements set current_item_id = :item, updated_at = :now where id = :id")
                .param("id", requirementId)
                .param("item", itemId)
                .param("now", now)
                .update();
    }

    public List<ItemRow> items(UUID requirementId) {
        return jdbc.sql("select " + ITEM + " from information_items where requirement_id = :requirement"
                        + " order by received_at desc, id")
                .param("requirement", requirementId)
                .query(ItemRow.class)
                .list();
    }

    public List<ItemRow> itemsByIds(Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        return jdbc.sql("select " + ITEM + " from information_items where id in (:ids)")
                .param("ids", ids)
                .query(ItemRow.class)
                .list();
    }

    /**
     * A person's decision on a pending answer, or their override of a rules rejection (ADR-027).
     *
     * @return whether the answer was in a state that allows this decision
     */
    public boolean decideByPerson(
            UUID itemId,
            VerificationState state,
            UUID reviewer,
            @Nullable String reason,
            @Nullable String overrideReason,
            OffsetDateTime now) {
        return jdbc.sql("""
                                update information_items
                                set verification_state = :state, reviewed_by = :by, reviewed_at = :now,
                                    review_reason = :reason, decided_by = 'PERSON', override_reason = :override
                                where id = :id
                                  and (verification_state = 'PENDING'
                                       or (verification_state = 'REJECTED' and decided_by = 'RULES'))
                                """)
                        .param("id", itemId)
                        .param("state", state.name())
                        .param("by", reviewer)
                        .param("reason", reason)
                        .param("override", overrideReason)
                        .param("now", now)
                        .update()
                > 0;
    }

    /**
     * A person confirms an accepted answer that stopped passing its checks, with an override reason
     * (ADR-027). The answer stays accepted.
     */
    public boolean reconfirm(UUID itemId, UUID reviewer, String overrideReason, OffsetDateTime now) {
        return jdbc.sql("""
                                update information_items
                                set override_reason = :override, reviewed_by = :by, reviewed_at = :now, decided_by = 'PERSON'
                                where id = :id and verification_state = 'ACCEPTED'
                                """)
                        .param("id", itemId)
                        .param("by", reviewer)
                        .param("override", overrideReason)
                        .param("now", now)
                        .update()
                > 0;
    }

    /** The rules' decision on a pending answer (ADR-027). */
    public boolean decideByRules(UUID itemId, VerificationState state, @Nullable String reason, OffsetDateTime now) {
        return jdbc.sql("""
                                update information_items
                                set verification_state = :state, reviewed_at = :now, review_reason = :reason,
                                    decided_by = 'RULES'
                                where id = :id and verification_state = 'PENDING'
                                """)
                        .param("id", itemId)
                        .param("state", state.name())
                        .param("reason", reason)
                        .param("now", now)
                        .update()
                > 0;
    }

    public void setConfidence(UUID itemId, java.math.@Nullable BigDecimal confidence) {
        jdbc.sql("update information_items set confidence = :confidence where id = :id")
                .param("id", itemId)
                .param("confidence", confidence)
                .update();
    }

    public void updateRules(UUID requirementId, int version, String acceptance, String risk, OffsetDateTime now) {
        jdbc.sql("""
                        update requirements set rules_version = :version, acceptance = :acceptance, risk = :risk,
                                                updated_at = :now
                        where id = :id
                        """)
                .param("id", requirementId)
                .param("version", version)
                .param("acceptance", acceptance)
                .param("risk", risk)
                .param("now", now)
                .update();
    }
}
