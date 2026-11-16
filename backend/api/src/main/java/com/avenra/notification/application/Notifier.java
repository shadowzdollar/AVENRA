package com.avenra.notification.application;

import com.avenra.agent.AgentEvents;
import com.avenra.identity.UserDirectory;
import com.avenra.information.InformationEvents;
import com.avenra.information.WorkGate;
import com.avenra.integration.IntegrationEvents;
import com.avenra.notification.domain.Category;
import com.avenra.notification.infrastructure.NotificationRepository;
import com.avenra.notification.infrastructure.NotificationRepository.NotificationRow;
import com.avenra.organization.OrganizationAccess;
import com.avenra.organization.domain.Permission;
import com.avenra.platform.AvenraProperties;
import com.avenra.platform.email.EmailMessage;
import com.avenra.platform.email.OutgoingEmail;
import com.avenra.platform.jobs.JobHandler;
import com.avenra.platform.jobs.JobQueue;
import com.avenra.work.WorkEvents;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import tools.jackson.databind.json.JsonMapper;

/**
 * Decides who is told what (ADR-035). Listeners only queue a job, so a fact recorded in a client's
 * request-link scope is handled in the organization's scope; the job resolves recipients from
 * current memberships and permissions, writes one notification per person and key, and queues an
 * email when the person's preference allows it.
 */
@Configuration(proxyBeanMethods = false)
class Notifier {

    static final String NOTIFY = "notification.notify";

    /**
     * What happened, as the job reads it.
     *
     * @param dedupe the key that makes this notification once per person
     */
    record Notice(
            String category,
            UUID organizationId,
            @Nullable UUID workId,
            String sourceType,
            String sourceId,
            String dedupe,
            Map<String, String> facts) {}

    private final JobQueue jobs;
    private final JsonMapper json;

    Notifier(JobQueue jobs, JsonMapper json) {
        this.jobs = jobs;
        this.json = json;
    }

    private void queue(Notice notice) {
        jobs.enqueue(
                JobQueue.Request.of(NOTIFY, notice.organizationId(), Map.of("notice", json.writeValueAsString(notice)))
                        .idempotencyKey("notify:" + notice.dedupe()));
    }

    @EventListener
    void on(WorkEvents.ExceptionRaised raised) {
        queue(new Notice(
                Category.EXCEPTION.code(),
                raised.organizationId(),
                raised.workId(),
                "exception",
                raised.exceptionId().toString(),
                "exception:" + raised.exceptionId(),
                Map.of("severity", raised.severity(), "description", raised.description())));
    }

    @EventListener
    void on(WorkEvents.ExceptionUnattended unattended) {
        queue(new Notice(
                Category.ESCALATION.code(),
                unattended.organizationId(),
                unattended.workId(),
                "exception",
                unattended.exceptionId().toString(),
                "escalation:" + unattended.exceptionId(),
                Map.of("description", unattended.description())));
    }

    @EventListener
    void on(InformationEvents.AnswerReceived received) {
        if (!received.fromClient()) {
            return; // the team knows what it entered itself
        }
        queue(new Notice(
                Category.ANSWER.code(),
                received.organizationId(),
                received.workId(),
                "information_item",
                received.itemId().toString(),
                "answer:" + received.itemId(),
                Map.of("requirement", received.requirementTitle())));
    }

    @EventListener
    void on(InformationEvents.RequestExpiredIncomplete expired) {
        queue(new Notice(
                Category.REQUEST.code(),
                expired.organizationId(),
                expired.workId(),
                "request_link",
                expired.requestLinkId().toString(),
                "request-expired:" + expired.requestLinkId(),
                Map.of(
                        "missing",
                        String.valueOf(expired.missing()),
                        "sentBy",
                        expired.sentBy().toString())));
    }

    @EventListener
    void on(AgentEvents.ApprovalNeeded needed) {
        String what = needed.highRiskStep() ? "step" : "plan";
        queue(new Notice(
                Category.APPROVAL.code(),
                needed.organizationId(),
                needed.workId(),
                "agent_run",
                needed.runId().toString(),
                "approval:" + needed.runId() + ":" + what + ":" + UUID.randomUUID(),
                Map.of("highRiskStep", String.valueOf(needed.highRiskStep()))));
    }

    @EventListener
    void on(IntegrationEvents.ConnectionPaused paused) {
        queue(new Notice(
                Category.INTEGRATION.code(),
                paused.organizationId(),
                null,
                "integration_connection",
                paused.connectionId().toString(),
                "integration-paused:" + paused.connectionId() + ":" + UUID.randomUUID(),
                Map.of("name", paused.name(), "failures", String.valueOf(paused.consecutiveFailures()))));
    }

    @Bean
    JobHandler notificationHandler(
            NotificationRepository repository,
            OrganizationAccess organizations,
            WorkGate work,
            UserDirectory users,
            OutgoingEmail email,
            AvenraProperties properties,
            MeterRegistry meters,
            Clock clock) {
        return JobHandler.of(NOTIFY, job -> {
            Notice notice = json.readValue(job.payload().path("notice").asString(), Notice.class);
            Category category = Category.of(notice.category()).orElseThrow();
            UUID org = notice.organizationId();
            String organization = organizations.organizationName(org);
            var target = notice.workId() == null
                    ? null
                    : work.find(org, notice.workId()).orElse(null);
            String workTitle = target == null ? null : target.title();
            UUID owner = target == null || target.ownerMembershipId() == null
                    ? null
                    : organizations
                            .userOfMembership(org, target.ownerMembershipId())
                            .orElse(null);
            var recipients = new LinkedHashSet<UUID>();
            Templates.Text text;
            String link;
            switch (category) {
                case EXCEPTION -> {
                    recipients.addAll(
                            owner != null
                                    ? List.of(owner)
                                    : organizations.usersWithPermission(org, Permission.WORK_APPROVE));
                    text = Templates.exception(
                            organization,
                            workTitle,
                            notice.facts().get("severity"),
                            notice.facts().get("description"));
                    link = workLink(org, notice.workId());
                }
                case ESCALATION -> {
                    recipients.addAll(organizations.owners(org));
                    text = Templates.escalation(
                            organization, workTitle, notice.facts().get("description"));
                    link = workLink(org, notice.workId());
                }
                case ANSWER -> {
                    recipients.addAll(
                            owner != null
                                    ? List.of(owner)
                                    : organizations.usersWithPermission(org, Permission.INFORMATION_VERIFY));
                    text = Templates.answer(
                            organization,
                            String.valueOf(workTitle),
                            notice.facts().get("requirement"));
                    link = workLink(org, notice.workId());
                }
                case REQUEST -> {
                    UUID sender = UUID.fromString(notice.facts().get("sentBy"));
                    if (organizations.isMember(org, sender)) {
                        recipients.add(sender);
                    }
                    if (owner != null) {
                        recipients.add(owner);
                    }
                    text = Templates.requestExpired(
                            organization,
                            String.valueOf(workTitle),
                            Long.parseLong(notice.facts().get("missing")));
                    link = workLink(org, notice.workId());
                }
                case APPROVAL -> {
                    recipients.addAll(organizations.usersWithPermission(org, Permission.WORK_APPROVE));
                    text = Templates.approval(
                            organization,
                            String.valueOf(workTitle),
                            Boolean.parseBoolean(notice.facts().get("highRiskStep")));
                    link = workLink(org, notice.workId());
                }
                case INTEGRATION -> {
                    recipients.addAll(organizations.usersWithPermission(org, Permission.INTEGRATION_MANAGE));
                    text = Templates.integrationPaused(
                            organization,
                            notice.facts().get("name"),
                            Integer.parseInt(notice.facts().get("failures")));
                    link = "/organizations/" + org + "/integrations";
                }
                default -> throw new IllegalStateException("unknown category " + category);
            }
            OffsetDateTime now = OffsetDateTime.now(clock);
            var people = users.findAll(new ArrayList<>(recipients));
            for (UUID recipient : recipients) {
                boolean wantsEmail =
                        repository.email(recipient, category.code()).orElse(category.emailByDefault());
                var person = people.get(recipient);
                boolean sendEmail = wantsEmail && person != null && person.emailVerified();
                var row = new NotificationRow(
                        UUID.randomUUID(),
                        org,
                        recipient,
                        category.code(),
                        text.title(),
                        text.body(),
                        link,
                        notice.sourceType(),
                        notice.sourceId(),
                        notice.dedupe(),
                        sendEmail ? "QUEUED" : "NOT_SENT",
                        now,
                        null);
                if (!repository.insert(row)) {
                    continue; // already told
                }
                meters.counter("avenra.notifications", "category", category.code(), "email", String.valueOf(sendEmail))
                        .increment();
                if (sendEmail) {
                    String url = properties.web().publicBaseUrl().toString().replaceAll("/+$", "") + link;
                    email.queue(
                            new EmailMessage(
                                    person.email(),
                                    text.title(),
                                    text.body() + "\n\nOpen it in Avenra: " + url
                                            + "\n\nYou can choose which notifications you get by email in your account settings.",
                                    "notification-" + category.code()),
                            org);
                }
            }
        });
    }

    private static String workLink(UUID organizationId, @Nullable UUID workId) {
        return workId == null
                ? "/organizations/" + organizationId
                : "/organizations/" + organizationId + "/work/" + workId;
    }
}
