package com.avenra.information.application;

import com.avenra.audit.AuditLog;
import com.avenra.contract.v1.model.ClientRequest;
import com.avenra.contract.v1.model.ClientRequestItem;
import com.avenra.contract.v1.model.RequirementState;
import com.avenra.document.Documents;
import com.avenra.information.WorkGate;
import com.avenra.information.WorkGate.WorkInfo;
import com.avenra.information.domain.Completeness;
import com.avenra.information.domain.RequirementKind;
import com.avenra.information.infrastructure.RequestLinkRepository;
import com.avenra.information.infrastructure.RequestLinkRepository.LinkRow;
import com.avenra.information.infrastructure.RequirementRepository;
import com.avenra.information.infrastructure.RequirementRepository.RequirementRow;
import com.avenra.organization.OrganizationAccess;
import com.avenra.platform.crypto.SecureTokens;
import com.avenra.platform.tenancy.TenantScope;
import com.avenra.platform.tenancy.TenantTransactions;
import com.avenra.platform.web.ApiException;
import com.avenra.platform.web.ApiTime;
import java.io.InputStream;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.function.BiFunction;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * What a client holding a request link can do (ADR-020): see the requested items, answer them and
 * upload files. Every transaction carries only the hash of the link token, so row-level security
 * exposes nothing but the link's own requirements; there is no user and no organization in scope.
 */
@Service
public class ClientRequestService {

    private final RequestLinkRepository links;
    private final RequirementRepository requirements;
    private final WorkGate work;
    private final Submissions submissions;
    private final Documents documents;
    private final InformationViews views;
    private final OrganizationAccess organizations;
    private final TenantTransactions transactions;
    private final AuditLog audit;
    private final Clock clock;

    ClientRequestService(
            RequestLinkRepository links,
            RequirementRepository requirements,
            WorkGate work,
            Submissions submissions,
            Documents documents,
            InformationViews views,
            OrganizationAccess organizations,
            TenantTransactions transactions,
            AuditLog audit,
            Clock clock) {
        this.links = links;
        this.requirements = requirements;
        this.work = work;
        this.submissions = submissions;
        this.documents = documents;
        this.views = views;
        this.organizations = organizations;
        this.transactions = transactions;
        this.audit = audit;
        this.clock = clock;
    }

    /** The link, the work it belongs to and the requirements it covers, inside the link's scope. */
    private record Context(LinkRow link, WorkInfo work, List<RequirementRow> requirements) {

        RequirementRow requirement(UUID requirementId) {
            return requirements.stream()
                    .filter(row -> row.id().equals(requirementId))
                    .findFirst()
                    .orElseThrow(ApiException::notFound);
        }
    }

    public ClientRequest open(String token) {
        return withLink(token, (context, now) -> {
            links.markOpened(context.link().id(), now);
            audit.record(event("work.request_link.opened", context));
            var loaded = views.load(context.requirements());
            var items = context.requirements().stream()
                    .map(requirement -> item(requirement, loaded))
                    .toList();
            return new ClientRequest(
                            organizations.organizationName(context.link().organizationId()),
                            context.work().title(),
                            mask(context.link().recipientEmail()),
                            ApiTime.utc(context.link().expiresAt()),
                            items)
                    .message(context.link().message());
        });
    }

    public ClientRequestItem submitValue(String token, UUID requirementId, String value) {
        return withLink(token, (context, now) -> {
            var requirement = lock(context, requirementId);
            submissions.submitValue(
                    requirement,
                    value,
                    Submissions.Source.requestLink(context.link().id()));
            return reloaded(context, requirementId);
        });
    }

    public ClientRequestItem uploadFile(
            String token, UUID requirementId, InputStream content, @Nullable String fileName) {
        // Validate the link and the target before spending time on the file.
        withLink(token, (context, now) -> {
            Submissions.requireDocument(context.requirement(requirementId));
            return null;
        });
        try (var prepared = documents.prepare(content, fileName)) {
            var result = withLink(token, (context, now) -> {
                var requirement = lock(context, requirementId);
                var outcome = submissions.storeFile(
                        requirement,
                        prepared,
                        Submissions.Source.requestLink(context.link().id()));
                return outcome.rejected() ? null : reloaded(context, requirementId);
            });
            if (result == null) {
                throw Submissions.fileRejected();
            }
            return result;
        }
    }

    /**
     * Runs {@code work} in a transaction scoped to the link with this token. Unknown, expired and
     * revoked links, and links of finished work, look the same to the caller.
     */
    private <T> T withLink(String token, BiFunction<Context, OffsetDateTime, T> action) {
        byte[] hash = SecureTokens.hash(token);
        return transactions.run(TenantScope.requestLink(HexFormat.of().formatHex(hash)), () -> {
            OffsetDateTime now = OffsetDateTime.now(clock);
            LinkRow link = links.findUsableByTokenHash(hash, now).orElseThrow(ClientRequestService::invalidLink);
            WorkInfo target = work.findForRequestLink(link.workId()).orElseThrow(ClientRequestService::invalidLink);
            if (target.finished()) {
                throw invalidLink();
            }
            var covered = links.requirementIds(List.of(link.id())).getOrDefault(link.id(), List.of());
            return action.apply(new Context(link, target, requirements.byIds(covered)), now);
        });
    }

    private RequirementRow lock(Context context, UUID requirementId) {
        context.requirement(requirementId);
        return requirements.findForUpdate(context.work().id(), requirementId).orElseThrow(ApiException::notFound);
    }

    private ClientRequestItem reloaded(Context context, UUID requirementId) {
        var requirement =
                requirements.findForUpdate(context.work().id(), requirementId).orElseThrow(ApiException::notFound);
        return item(requirement, views.load(List.of(requirement)));
    }

    private static ClientRequestItem item(RequirementRow requirement, InformationViews.LoadedRequirements loaded) {
        Completeness.RequirementState state = loaded.state(requirement);
        var item = new ClientRequestItem(
                        requirement.id(),
                        requirement.title(),
                        InformationViews.kind(requirement),
                        requirement.required(),
                        RequirementState.fromValue(state.name()))
                .instructions(requirement.instructions());
        if (state == Completeness.RequirementState.REJECTED) {
            var current = loaded.current(requirement);
            item.rejectionReason(current == null ? null : current.reviewReason());
        }
        if (requirement.kind() == RequirementKind.DOCUMENT) {
            item.acceptedFileTypes(Documents.ACCEPTED_EXTENSIONS);
        }
        return item;
    }

    private static AuditLog.Event event(String action, Context context) {
        return AuditLog.Event.of(action, context.link().organizationId(), null)
                .resource("request_link", context.link().id())
                .detail("workId", context.work().id().toString());
    }

    /** {@code jane.doe@example.com} → {@code j•••@example.com}. */
    static String mask(String email) {
        int at = email.indexOf('@');
        if (at <= 0) {
            return "•••";
        }
        return email.charAt(0) + "•••" + email.substring(at);
    }

    private static ApiException invalidLink() {
        return new ApiException(
                "REQUEST_LINK_INVALID",
                HttpStatus.NOT_FOUND,
                "This link is invalid, has expired or was withdrawn. Ask the sender for a new one.");
    }
}
