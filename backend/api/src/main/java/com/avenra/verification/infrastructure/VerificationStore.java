package com.avenra.verification.infrastructure;

import com.avenra.verification.domain.Result;
import com.avenra.verification.domain.Rule;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/** Rules, verification results, evidence and completion manifests. All insert-only (V6). */
@Repository
public class VerificationStore {

    public record ResultRow(
            UUID id,
            UUID organizationId,
            UUID workId,
            UUID requirementId,
            UUID itemId,
            int rulesVersion,
            Result result,
            List<Map<String, String>> evidence,
            OffsetDateTime createdAt) {}

    public record EvidenceRow(
            UUID id,
            UUID workId,
            @Nullable UUID requirementId,
            String kind,
            String referenceType,
            UUID referenceId,
            String description,
            @Nullable String fingerprint,
            OffsetDateTime createdAt) {}

    public record CompletionRow(UUID workId, String manifest, String sha256, OffsetDateTime completedAt) {}

    /** The parameters of a rule as stored; everything but type, severity and message. */
    record Params(
            @Nullable String pattern,
            @Nullable Integer minLength,
            @Nullable Integer maxLength,
            @Nullable List<String> values,
            @Nullable BigDecimal min,
            @Nullable BigDecimal max,
            @Nullable LocalDate notBefore,
            @Nullable LocalDate notAfter,
            @Nullable Integer minDaysFromToday,
            @Nullable Integer maxDaysFromToday,
            @Nullable UUID otherRequirementId,
            Rule.@Nullable Order order,
            @Nullable List<String> contentTypes,
            @Nullable Long maxBytes,
            @Nullable String field,
            Rule.@Nullable FieldKind fieldKind) {}

    private static final TypeReference<List<Result.Check>> CHECKS = new TypeReference<>() {};
    private static final TypeReference<List<Map<String, String>>> REFS = new TypeReference<>() {};

    private final JdbcClient jdbc;
    private final JsonMapper json;

    VerificationStore(JdbcClient jdbc, JsonMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    public void insertRules(
            UUID organizationId,
            UUID requirementId,
            int version,
            List<Rule> rules,
            @Nullable UUID by,
            OffsetDateTime now) {
        for (int position = 0; position < rules.size(); position++) {
            Rule rule = rules.get(position);
            var params = new Params(
                    rule.pattern(),
                    rule.minLength(),
                    rule.maxLength(),
                    rule.values().isEmpty() ? null : rule.values(),
                    rule.min(),
                    rule.max(),
                    rule.notBefore(),
                    rule.notAfter(),
                    rule.minDaysFromToday(),
                    rule.maxDaysFromToday(),
                    rule.otherRequirementId(),
                    rule.order(),
                    rule.contentTypes().isEmpty() ? null : rule.contentTypes(),
                    rule.maxBytes(),
                    rule.field(),
                    rule.fieldKind());
            jdbc.sql("""
                            insert into verification_rules (id, organization_id, requirement_id, version, position, type,
                                                            severity, message, params, created_by, created_at)
                            values (:id, :org, :requirement, :version, :position, :type, :severity, :message,
                                    cast(:params as jsonb), :by, :now)
                            """)
                    .param("id", rule.id() == null ? UUID.randomUUID() : rule.id())
                    .param("org", organizationId)
                    .param("requirement", requirementId)
                    .param("version", version)
                    .param("position", position)
                    .param("type", rule.type().name())
                    .param("severity", rule.severity().name())
                    .param("message", rule.message())
                    .param("params", json.writeValueAsString(withoutNulls(params)))
                    .param("by", by)
                    .param("now", now)
                    .update();
        }
    }

    public List<Rule> rules(UUID requirementId, int version) {
        return jdbc.sql("""
                        select id, type, severity, message, params::text from verification_rules
                        where requirement_id = :requirement and version = :version order by position
                        """)
                .param("requirement", requirementId)
                .param("version", version)
                .query((rs, row) -> {
                    var p = json.readValue(rs.getString(5), Params.class);
                    return new Rule(
                            rs.getObject(1, UUID.class),
                            Rule.Type.valueOf(rs.getString(2)),
                            Rule.Severity.valueOf(rs.getString(3)),
                            rs.getString(4),
                            p.pattern(),
                            p.minLength(),
                            p.maxLength(),
                            p.values(),
                            p.min(),
                            p.max(),
                            p.notBefore(),
                            p.notAfter(),
                            p.minDaysFromToday(),
                            p.maxDaysFromToday(),
                            p.otherRequirementId(),
                            p.order(),
                            p.contentTypes(),
                            p.maxBytes(),
                            p.field(),
                            p.fieldKind());
                })
                .list();
    }

    /** Requirements whose rules (in the given version) refer to {@code requirementId}, with that version. */
    public Map<UUID, Integer> referring(UUID organizationId, UUID requirementId) {
        var found = new LinkedHashMap<UUID, Integer>();
        jdbc.sql("""
                        select distinct requirement_id, version from verification_rules
                        where organization_id = :org and params->>'otherRequirementId' = :other
                        """)
                .param("org", organizationId)
                .param("other", requirementId.toString())
                .query((rs, row) -> Map.entry(rs.getObject(1, UUID.class), rs.getInt(2)))
                .list()
                .forEach(entry -> found.merge(entry.getKey(), entry.getValue(), Math::max));
        return found;
    }

    public void insertResult(ResultRow row) {
        jdbc.sql("""
                        insert into verifications (id, organization_id, work_id, requirement_id, item_id, rules_version,
                                                   status, confidence, checks, evidence, method, created_at)
                        values (:id, :org, :work, :requirement, :item, :version, :status, :confidence,
                                cast(:checks as jsonb), cast(:evidence as jsonb), 'RULES', :at)
                        """)
                .param("id", row.id())
                .param("org", row.organizationId())
                .param("work", row.workId())
                .param("requirement", row.requirementId())
                .param("item", row.itemId())
                .param("version", row.rulesVersion())
                .param("status", row.result().status().name())
                .param("confidence", row.result().confidence())
                .param("checks", json.writeValueAsString(row.result().checks()))
                .param("evidence", json.writeValueAsString(row.evidence()))
                .param("at", row.createdAt())
                .update();
    }

    private static final String RESULT = "id, organization_id, work_id, requirement_id, item_id, rules_version, status,"
            + " confidence, checks::text, evidence::text, created_at";

    public Map<UUID, ResultRow> latestForItems(Collection<UUID> itemIds) {
        if (itemIds.isEmpty()) {
            return Map.of();
        }
        var latest = new LinkedHashMap<UUID, ResultRow>();
        jdbc.sql("select distinct on (item_id) " + RESULT + " from verifications where item_id in (:items)"
                        + " order by item_id, created_at desc, id desc")
                .param("items", itemIds)
                .query(this::result)
                .list()
                .forEach(row -> latest.put(row.itemId(), row));
        return latest;
    }

    public List<ResultRow> forRequirement(UUID requirementId) {
        return jdbc.sql("select " + RESULT + " from verifications where requirement_id = :requirement"
                        + " order by created_at desc, id desc limit 200")
                .param("requirement", requirementId)
                .query(this::result)
                .list();
    }

    private ResultRow result(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        return new ResultRow(
                rs.getObject(1, UUID.class),
                rs.getObject(2, UUID.class),
                rs.getObject(3, UUID.class),
                rs.getObject(4, UUID.class),
                rs.getObject(5, UUID.class),
                rs.getInt(6),
                new Result(
                        Result.Status.valueOf(rs.getString(7)),
                        rs.getBigDecimal(8),
                        json.readValue(rs.getString(9), CHECKS)),
                json.readValue(rs.getString(10), REFS),
                rs.getObject(11, OffsetDateTime.class));
    }

    public void insertEvidence(UUID organizationId, EvidenceRow row) {
        jdbc.sql("""
                        insert into evidence (id, organization_id, work_id, requirement_id, kind, reference_type,
                                              reference_id, description, fingerprint, created_at)
                        values (:id, :org, :work, :requirement, :kind, :refType, :refId, :description, :fingerprint, :at)
                        """)
                .param("id", row.id())
                .param("org", organizationId)
                .param("work", row.workId())
                .param("requirement", row.requirementId())
                .param("kind", row.kind())
                .param("refType", row.referenceType())
                .param("refId", row.referenceId())
                .param("description", row.description())
                .param("fingerprint", row.fingerprint())
                .param("at", row.createdAt())
                .update();
    }

    public List<EvidenceRow> evidence(UUID organizationId, UUID workId) {
        return jdbc.sql("""
                        select id, work_id, requirement_id, kind, reference_type, reference_id, description, fingerprint,
                               created_at
                        from evidence where organization_id = :org and work_id = :work
                        order by created_at desc, id desc limit 500
                        """)
                .param("org", organizationId)
                .param("work", workId)
                .query(EvidenceRow.class)
                .list();
    }

    public List<EvidenceRow> organizationEvidence(UUID organizationId, @Nullable String kind) {
        return jdbc.sql("""
                        select id, work_id, requirement_id, kind, reference_type, reference_id, description, fingerprint,
                               created_at
                        from evidence where organization_id = :org and (cast(:kind as text) is null or kind = :kind)
                        order by created_at desc, id desc limit 200
                        """)
                .param("org", organizationId)
                .param("kind", kind)
                .query(EvidenceRow.class)
                .list();
    }

    public void insertCompletion(UUID organizationId, CompletionRow row) {
        jdbc.sql("""
                        insert into work_completions (organization_id, work_id, manifest, sha256, completed_at)
                        values (:org, :work, :manifest, :sha, :at)
                        """)
                .param("org", organizationId)
                .param("work", row.workId())
                .param("manifest", row.manifest())
                .param("sha", row.sha256())
                .param("at", row.completedAt())
                .update();
    }

    public Optional<CompletionRow> completion(UUID organizationId, UUID workId) {
        return jdbc.sql("select work_id, manifest, sha256, completed_at from work_completions"
                        + " where organization_id = :org and work_id = :work")
                .param("org", organizationId)
                .param("work", workId)
                .query(CompletionRow.class)
                .optional();
    }

    private Map<String, Object> withoutNulls(Params params) {
        var map = new LinkedHashMap<String, Object>();
        json.convertValue(params, new TypeReference<Map<String, Object>>() {}).forEach((key, value) -> {
            if (value != null) {
                map.put(key, value);
            }
        });
        return map;
    }
}
