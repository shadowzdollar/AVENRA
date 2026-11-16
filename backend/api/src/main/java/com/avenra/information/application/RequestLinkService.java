package com.avenra.information.application;

import com.avenra.audit.AuditLog;
import com.avenra.contract.v1.model.CreateRequestLinkRequest;
import com.avenra.contract.v1.model.RequestLink;
import com.avenra.identity.UserDirectory;
import com.avenra.information.InformationEvents;
import com.avenra.information.WorkGate;
import com.avenra.information.infrastructure.RequestLinkRepository;
import com.avenra.information.infrastructure.RequestLinkRepository.LinkRow;
import com.avenra.information.infrastructure.RequirementRepository;
import com.avenra.organization.OrganizationAccess;
import com.avenra.organization.domain.Permission;
import com.avenra.platform.AvenraProperties;
import com.avenra.platform.crypto.SecretBox;
import com.avenra.platform.crypto.SecureTokens;
import com.avenra.platform.email.EmailMessage;
import com.avenra.platform.email.OutgoingEmail;
import com.avenra.platform.idempotency.Idempotency;
import com.avenra.platform.jobs.JobQueue;
import com.avenra.platform.web.ApiException;
import com.avenra.platform.web.Text;
import java.net.URI;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Request links that ask a client for information without an account (ADR-020). The token goes
 * only into the email; the API never returns it and stores only its hash.
 */
@Service
public class RequestLinkService {

    private final RequestLinkRepository links;
    private final RequirementRepository requirements;
    private final WorkGate work;
    private final OrganizationAccess access;
    private final Idempotency idempotency;
    private final UserDirectory users;
    private final OutgoingEmail outgoing;
    private final SecretBox box;
    private final ApplicationEventPublisher events;
    private final AuditLog audit;
    private final InformationViews views;
    private final JobQueue jobs;
    private final URI publicBaseUrl;
    private final Clock clock;

    RequestLinkService(
            RequestLinkRepository links,
            RequirementRepository requirements,
            WorkGate work,
            OrganizationAccess access,
            Idempotency idempotency,
            UserDirectory users,
            OutgoingEmail outgoing,
            SecretBox box,
            ApplicationEventPublisher events,
            AuditLog audit,
            InformationViews views,
            JobQueue jobs,
            AvenraProperties properties,
            Clock clock) {
        this.links = links;
        this.requirements = requirements;
        this.work = work;
        this.access = access;
        this.idempotency = idempotency;
        this.users = users;
        this.outgoing = outgoing;
        this.box = box;
        this.events = events;
        this.audit = audit;
        this.views = views;
        this.jobs = jobs;
        this.publicBaseUrl = properties.web().publicBaseUrl();
        this.clock = clock;
    }

    public List<RequestLink> list(UUID userId, UUID organizationId, UUID workId) {
        return access.run(userId, organizationId, Permission.INFORMATION_READ, granted -> {
            work.find(organizationId, workId).orElseThrow(ApiException::notFound);
            return views(organizationId, links.forWork(organizationId, workId), null);
        });
    }

    /** The organization's newest requests across all work, with the work each belongs to (ADR-039). */
    public List<RequestLink> organizationList(UUID userId, UUID organizationId, @Nullable String status) {
        return access.run(userId, organizationId, Permission.INFORMATION_READ, granted -> {
            var rows = links.forOrganization(organizationId, status, OffsetDateTime.now(clock));
            var titles = new java.util.HashMap<UUID, String>();
            for (var row : rows) {
                titles.computeIfAbsent(
                        row.workId(),
                        id -> work.find(organizationId, id)
                                .map(WorkGate.WorkInfo::title)
                                .orElse(""));
            }
            return views(organizationId, rows, titles);
        });
    }

    private List<RequestLink> views(
            UUID organizationId, List<LinkRow> rows, java.util.@Nullable Map<UUID, String> titles) {
        var ids = rows.stream().map(LinkRow::id).toList();
        var requirementIds = links.requirementIds(ids);
        var answered = links.answeredCounts(organizationId, ids);
        OffsetDateTime now = OffsetDateTime.now(clock);
        return rows.stream()
                .map(row -> {
                    var view = InformationViews.link(row, requirementIds.getOrDefault(row.id(), List.of()), now)
                            .answeredCount(answered.getOrDefault(row.id(), 0));
                    String title = titles == null ? null : titles.get(row.workId());
                    return title == null || title.isEmpty() ? view : view.workTitle(title);
                })
                .toList();
    }

    /** A reminder sent on request at most this often. */
    static final java.time.Duration MANUAL_REMINDER_GAP = java.time.Duration.ofHours(1);

    /** No request gets more reminders than this, scheduled and manual together. */
    static final int MAX_REMINDERS = 10;

    /**
     * Reminds the recipient now (ADR-039). Queues the same job, with the same key, as the scheduled
     * reminders, so a reminder is sent once even if a scheduled one falls due at the same time.
     */
    public RequestLink remind(UUID userId, UUID organizationId, UUID workId, UUID linkId) {
        return access.run(userId, organizationId, Permission.INFORMATION_COLLECT, granted -> {
            work.find(organizationId, workId).orElseThrow(ApiException::notFound);
            var link = links.findForUpdate(organizationId, linkId)
                    .filter(row -> row.workId().equals(workId))
                    .orElseThrow(ApiException::notFound);
            OffsetDateTime now = OffsetDateTime.now(clock);
            var target = work.find(organizationId, workId).orElseThrow(ApiException::notFound);
            if (link.revokedAt() != null || !link.expiresAt().isAfter(now) || target.finished()) {
                throw ApiException.conflict(
                        "REQUEST_LINK_INACTIVE", "This request is revoked, expired or its work is finished.");
            }
            if (outstanding(linkId).isEmpty()) {
                throw ApiException.conflict("NOTHING_TO_REMIND", "Everything this request asked for was answered.");
            }
            if (link.remindersSent() >= MAX_REMINDERS) {
                throw ApiException.conflict("REMINDER_LIMIT", "This request has had as many reminders as it may.");
            }
            OffsetDateTime last = link.lastRemindedAt() == null ? link.createdAt() : link.lastRemindedAt();
            if (now.isBefore(last.plus(MANUAL_REMINDER_GAP))) {
                throw ApiException.conflict("REMINDER_TOO_SOON", "The recipient heard from you less than an hour ago.");
            }
            int number = link.remindersSent() + 1;
            jobs.enqueue(JobQueue.Request.of(
                            FollowUps.REMIND,
                            organizationId,
                            java.util.Map.of("requestLinkId", linkId.toString(), "reminder", number))
                    .idempotencyKey(linkId + ":" + number));
            audit.record(AuditLog.Event.of("work.request_link.reminder_requested", organizationId, userId)
                    .resource("request_link", linkId)
                    .detail("workId", workId.toString())
                    .detail("reminder", number));
            return views(organizationId, List.of(link), null).getFirst();
        });
    }

    /** Titles of the required items the link asked for that are still missing or were rejected. */
    @org.springframework.transaction.annotation.Transactional(
            propagation = org.springframework.transaction.annotation.Propagation.MANDATORY)
    public List<String> outstanding(UUID linkId) {
        var covered = links.requirementIds(List.of(linkId)).getOrDefault(linkId, List.of());
        var rows = requirements.byIds(covered);
        var loaded = views.load(rows);
        return rows.stream()
                .filter(RequirementRepository.RequirementRow::required)
                .filter(row -> {
                    var state = loaded.state(row);
                    return state == com.avenra.information.domain.Completeness.RequirementState.MISSING
                            || state == com.avenra.information.domain.Completeness.RequirementState.REJECTED;
                })
                .map(RequirementRepository.RequirementRow::title)
                .toList();
    }

    public RequestLink create(
            UUID userId, UUID organizationId, UUID workId, String idempotencyKey, CreateRequestLinkRequest input) {
        String email = UserDirectory.normalizeEmail(input.getRecipientEmail());
        String name = Text.optional(input.getRecipientName());
        String message = Text.optional(input.getMessage());
        Set<UUID> requested = new TreeSet<>(input.getRequirementIds());
        return access.run(userId, organizationId, Permission.INFORMATION_COLLECT, granted -> {
            int days = input.getExpiresInDays() == null
                    ? access.requestLinkDays(organizationId)
                    : input.getExpiresInDays();
            return idempotency.once(
                    userId,
                    "createRequestLink",
                    idempotencyKey,
                    Text.fingerprint(organizationId, workId, email, name, message, input.getExpiresInDays(), requested),
                    RequestLink.class,
                    () -> {
                        var target = work.lockOpen(organizationId, workId);
                        var ofWork = requirements.forWork(organizationId, workId).stream()
                                .map(RequirementRepository.RequirementRow::id)
                                .toList();
                        if (!ofWork.containsAll(requested)) {
                            throw ApiException.invalid("requirementIds", "must be requirements of this work");
                        }
                        OffsetDateTime now = OffsetDateTime.now(clock);
                        String token = SecureTokens.generate();
                        var row = new LinkRow(
                                UUID.randomUUID(),
                                organizationId,
                                workId,
                                email,
                                name,
                                message,
                                userId,
                                now,
                                now.plus(Duration.ofDays(days)),
                                null,
                                null,
                                0,
                                null,
                                null);
                        var sealed = box.seal(
                                token.getBytes(java.nio.charset.StandardCharsets.UTF_8), tokenContext(row.id()));
                        links.insert(
                                row,
                                SecureTokens.hash(token),
                                new RequestLinkRepository.SealedToken(sealed.keyId(), sealed.ciphertext()),
                                requested);
                        events.publishEvent(
                                new InformationEvents.InformationRequested(organizationId, workId, row.id()));
                        String sender = users.find(userId)
                                .map(UserDirectory.UserSummary::displayName)
                                .orElse("Someone");
                        outgoing.queue(
                                requestEmail(
                                        email,
                                        name,
                                        sender,
                                        access.organizationName(organizationId),
                                        target.title(),
                                        token,
                                        days),
                                organizationId);
                        audit.record(AuditLog.Event.of("work.request_link.created", organizationId, userId)
                                .resource("request_link", row.id())
                                .detail("workId", workId.toString())
                                .detail("requirements", requested.size()));
                        return InformationViews.link(row, List.copyOf(requested), now);
                    });
        });
    }

    public void revoke(UUID userId, UUID organizationId, UUID workId, UUID linkId) {
        access.runWithoutResult(userId, organizationId, Permission.INFORMATION_COLLECT, granted -> {
            OffsetDateTime now = OffsetDateTime.now(clock);
            if (!links.revoke(organizationId, workId, linkId, now)) {
                // Revoking an already revoked link is a repeat; an unknown link is not found.
                links.find(organizationId, workId, linkId).orElseThrow(ApiException::notFound);
                return;
            }
            audit.record(AuditLog.Event.of("work.request_link.revoked", organizationId, userId)
                    .resource("request_link", linkId));
        });
    }

    /** A reminder for an unanswered request (ADR-025): the same link, and what is still outstanding. */
    EmailMessage reminderEmail(
            String to,
            @Nullable String recipientName,
            String organization,
            String workTitle,
            String token,
            java.util.List<String> outstanding,
            OffsetDateTime expiresAt) {
        String greeting = recipientName == null ? "Hello," : "Hello " + recipientName + ",";
        String items =
                outstanding.stream().map(title -> "- " + title).collect(java.util.stream.Collectors.joining("\n"));
        return new EmailMessage(
                to,
                "Reminder: " + organization + " is still waiting for information",
                greeting + "\n\n" + organization + " is still waiting for the following for \"" + workTitle + "\":\n\n"
                        + items + "\n\nOpen your secure link to answer (no account needed):\n\n" + linkUrl(token)
                        + "\n\nThe link works until " + expiresAt.toLocalDate() + ". If you have already sent"
                        + " everything, you can ignore this email.\n",
                "request-reminder");
    }

    /** Binds an encrypted token to its link, so ciphertexts cannot be moved between links. */
    static String tokenContext(UUID linkId) {
        return "request-link:" + linkId;
    }

    /** The link a client opens: the token travels in the fragment, never to a server or in a referrer. */
    String linkUrl(String token) {
        return UriComponentsBuilder.fromUri(publicBaseUrl)
                        .path("/request")
                        .build()
                        .toUriString() + "#" + token;
    }

    private EmailMessage requestEmail(
            String to,
            @Nullable String recipientName,
            String sender,
            String organization,
            String workTitle,
            String token,
            int days) {
        // The token travels in the fragment: browsers never send it to a server or in a referrer.
        String link = linkUrl(token);
        String greeting = recipientName == null ? "Hello," : "Hello " + recipientName + ",";
        return new EmailMessage(
                to,
                organization + " is asking you for information",
                greeting + "\n\n" + sender + " at " + organization + " needs some information from you for \""
                        + workTitle + "\".\n\nOpen this secure link to answer and upload files. You do not need an "
                        + "account:\n\n" + link + "\n\nThe link works for " + days + " days. Do not forward it: anyone "
                        + "with the link can answer. If you were not expecting this, ignore this email.\n",
                "request-link");
    }
}
