package com.avenra.information.application;

import static com.avenra.platform.web.ApiTime.utc;
import static com.avenra.platform.web.ApiTime.utcOrNull;

import com.avenra.contract.v1.model.DocumentVersion;
import com.avenra.contract.v1.model.InformationItem;
import com.avenra.contract.v1.model.InformationSource;
import com.avenra.contract.v1.model.RequestLink;
import com.avenra.contract.v1.model.Requirement;
import com.avenra.contract.v1.model.RequirementState;
import com.avenra.contract.v1.model.Verification;
import com.avenra.contract.v1.model.VerificationState;
import com.avenra.document.DocumentReadings;
import com.avenra.document.Documents;
import com.avenra.information.domain.Completeness;
import com.avenra.information.infrastructure.RequestLinkRepository.LinkRow;
import com.avenra.information.infrastructure.RequirementRepository;
import com.avenra.information.infrastructure.RequirementRepository.ItemRow;
import com.avenra.information.infrastructure.RequirementRepository.RequirementRow;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
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
 * Turns requirement, answer, document and link rows into contract models (ADR-008). Reads what it
 * needs inside the caller's tenant transaction; never decides access.
 */
@Component
public class InformationViews {

    private final RequirementRepository requirements;
    private final Documents documents;
    private final com.avenra.verification.Verification verification;
    private final DocumentReadings readings;

    InformationViews(
            RequirementRepository requirements,
            Documents documents,
            com.avenra.verification.Verification verification,
            DocumentReadings readings) {
        this.requirements = requirements;
        this.documents = documents;
        this.verification = verification;
        this.readings = readings;
    }

    /** Requirement rows with their current items and documents. */
    public record LoadedRequirements(
            List<RequirementRow> rows,
            Map<UUID, ItemRow> currentItems,
            Map<String, Documents.StoredVersion> versions,
            Map<UUID, com.avenra.verification.Verification.Recorded> results,
            Map<String, DocumentReadings.Reading> readings) {

        @Nullable
        public ItemRow current(RequirementRow row) {
            return row.currentItemId() == null ? null : currentItems.get(row.currentItemId());
        }

        public Completeness.RequirementState state(RequirementRow row) {
            ItemRow item = current(row);
            return Completeness.RequirementState.of(item == null ? null : item.verificationState());
        }

        public Completeness completeness() {
            return Completeness.of(rows.stream()
                    .map(row -> new Completeness.Entry(row.required(), state(row)))
                    .toList());
        }
    }

    public LoadedRequirements load(List<RequirementRow> rows) {
        var itemIds = rows.stream()
                .map(RequirementRow::currentItemId)
                .filter(Objects::nonNull)
                .toList();
        var items =
                requirements.itemsByIds(itemIds).stream().collect(Collectors.toMap(ItemRow::id, Function.identity()));
        var documentIds = items.values().stream()
                .map(ItemRow::documentId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        // Invisible in a request link's scope: clients never see readings.
        return new LoadedRequirements(
                rows,
                items,
                versionsOf(items.values()),
                verification.latest(items.keySet()),
                readings.latest(documentIds));
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

    public Requirement requirement(RequirementRow row, LoadedRequirements loaded) {
        var requirement = new Requirement(
                        row.id(),
                        row.title(),
                        kind(row),
                        row.required(),
                        RequirementState.fromValue(loaded.state(row).name()),
                        utc(row.createdAt()),
                        verification.rules(row.id(), row.rulesVersion()).stream()
                                .map(RuleInputs::toApi)
                                .toList(),
                        com.avenra.contract.v1.model.Acceptance.fromValue(row.acceptance()),
                        com.avenra.contract.v1.model.Risk.fromValue(row.risk()),
                        row.rulesVersion())
                .instructions(row.instructions());
        ItemRow current = loaded.current(row);
        if (current != null) {
            var item = item(current, loaded.versions(), loaded.results().get(current.id()));
            if (current.documentId() != null && current.documentVersion() != null) {
                var reading = loaded.readings().get(key(current.documentId(), current.documentVersion()));
                if (reading != null) {
                    item.reading(reading(reading));
                }
            }
            requirement.currentItem(item);
        }
        return requirement;
    }

    /** A reading as people see it: what was found and where, never a decision (ADR-031). */
    static com.avenra.contract.v1.model.DocumentReading reading(DocumentReadings.Reading reading) {
        var api = new com.avenra.contract.v1.model.DocumentReading(
                        com.avenra.contract.v1.model.DocumentReading.StatusEnum.fromValue(
                                reading.status().name()),
                        new ArrayList<>(),
                        false,
                        new ArrayList<>())
                .reason(reading.reason())
                .readAt(reading.readAt());
        var result = reading.result();
        if (result == null) {
            return api;
        }
        if (result.kind() != null) {
            api.kind(new com.avenra.contract.v1.model.DocumentReadingKind(
                    result.kind().label(), result.kind().confidence()));
        }
        return api.instructionsDetected(result.instructionsDetected())
                .model(result.model())
                .fields(result.fields().stream()
                        .map(field -> new com.avenra.contract.v1.model.DocumentField(
                                        field.name(),
                                        com.avenra.contract.v1.model.FieldKind.fromValue(field.kind()),
                                        field.found())
                                .value(field.value())
                                .quote(field.quote())
                                .page(field.page())
                                .located(field.located()))
                        .collect(Collectors.toCollection(ArrayList::new)))
                .proposals(result.proposals().stream()
                        .map(proposal -> new com.avenra.contract.v1.model.AiProposal(
                                com.avenra.contract.v1.model.AiProposal.ToolEnum.fromValue(proposal.tool()),
                                com.avenra.contract.v1.model.AiProposal.RiskEnum.fromValue(proposal.risk()),
                                proposal.reason()))
                        .collect(Collectors.toCollection(ArrayList::new)));
    }

    static InformationItem item(ItemRow row, Map<String, Documents.StoredVersion> versions) {
        return item(row, versions, null);
    }

    static InformationItem item(
            ItemRow row,
            Map<String, Documents.StoredVersion> versions,
            com.avenra.verification.Verification.@Nullable Recorded checks) {
        var source = new InformationSource(InformationSource.TypeEnum.fromValue(row.sourceType()))
                .userId(row.sourceUserId())
                .requestLinkId(row.sourceLinkId());
        var verification = new Verification(
                        VerificationState.fromValue(row.verificationState().name()))
                .reviewedByUserId(row.reviewedBy())
                .reviewedAt(utcOrNull(row.reviewedAt()))
                .reason(row.reviewReason())
                .decidedBy(
                        row.decidedBy() == null
                                ? null
                                : com.avenra.contract.v1.model.Verification.DecidedByEnum.fromValue(row.decidedBy()))
                .overrideReason(row.overrideReason());
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
        if (checks != null) {
            item.checks(result(checks));
        }
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
                        row.remindersSent(),
                        row.workId())
                .lastRemindedAt(utcOrNull(row.lastRemindedAt()))
                .recipientName(row.recipientName())
                .message(row.message())
                .createdByUserId(row.createdBy())
                .lastOpenedAt(utcOrNull(row.lastOpenedAt()))
                .revokedAt(utcOrNull(row.revokedAt()));
    }

    /** A verification result as the API shows it (Guidelines §25). */
    static com.avenra.contract.v1.model.VerificationResult result(
            com.avenra.verification.Verification.Recorded recorded) {
        var result = recorded.result();
        return new com.avenra.contract.v1.model.VerificationResult(
                        recorded.id(),
                        recorded.itemId(),
                        com.avenra.contract.v1.model.VerificationResult.StatusEnum.fromValue(
                                result.status().name()),
                        result.checks().stream()
                                .map(check -> new com.avenra.contract.v1.model.CheckResult(
                                                com.avenra.contract.v1.model.RuleType.fromValue(
                                                        check.rule().name()),
                                                com.avenra.contract.v1.model.CheckResult.OutcomeEnum.fromValue(
                                                        check.outcome().name()),
                                                com.avenra.contract.v1.model.RuleSeverity.fromValue(
                                                        check.severity().name()),
                                                check.message(),
                                                check.rule().aiDerived())
                                        .ruleId(check.ruleId())
                                        .detail(check.detail()))
                                .toList(),
                        recorded.evidence().stream()
                                .map(ref -> new com.avenra.contract.v1.model.Reference(
                                        ref.get("type"), UUID.fromString(ref.get("id"))))
                                .toList(),
                        com.avenra.contract.v1.model.VerificationResult.MethodEnum.RULES,
                        recorded.rulesVersion(),
                        utc(recorded.createdAt()))
                .confidence(result.confidence());
    }

    public static com.avenra.contract.v1.model.Completeness completeness(Completeness completeness) {
        return new com.avenra.contract.v1.model.Completeness(
                completeness.required(),
                completeness.accepted(),
                completeness.awaitingReview(),
                completeness.missing(),
                completeness.rejected(),
                completeness.complete());
    }

    static com.avenra.contract.v1.model.RequirementKind kind(RequirementRow row) {
        return com.avenra.contract.v1.model.RequirementKind.fromValue(row.kind().name());
    }

    public static String key(UUID documentId, int version) {
        return documentId + "/" + version;
    }
}
