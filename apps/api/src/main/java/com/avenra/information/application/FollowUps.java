package com.avenra.information.application;

import com.avenra.audit.AuditLog;
import com.avenra.information.InformationEvents;
import com.avenra.information.WorkGate;
import com.avenra.information.domain.Completeness;
import com.avenra.information.infrastructure.RequestLinkRepository;
import com.avenra.information.infrastructure.RequirementRepository;
import com.avenra.organization.OrganizationAccess;
import com.avenra.platform.crypto.SecretBox;
import com.avenra.platform.email.OutgoingEmail;
import com.avenra.platform.jobs.JobHandler;
import com.avenra.platform.jobs.JobSchedule;
import com.avenra.platform.jobs.JobWorker;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.validation.annotation.Validated;

/**
 * Scheduled follow-ups on requests (Guidelines §104–§105, ADR-025): reminders for unanswered
 * requests and links that expired with items missing. Sweeps run as platform jobs on persisted
 * schedules and enqueue one tenant job per item; each tenant job re-checks its conditions, so a
 * late or repeated job changes nothing.
 */
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(FollowUps.Settings.class)
class FollowUps {

    /**
     * Product defaults (ADR-025).
     *
     * @param firstReminderAfter time from sending a request to the first reminder
     * @param reminderEvery time between reminders
     * @param maxReminders reminders per request at most
     * @param sweepEvery how often the sweeps look for due follow-ups
     */
    @Validated
    @ConfigurationProperties("avenra.work.follow-ups")
    record Settings(
            @NotNull @DefaultValue("3d") Duration firstReminderAfter,
            @NotNull @DefaultValue("3d") Duration reminderEvery,
            @Min(0) @Max(10) @DefaultValue("3") int maxReminders,
            @NotNull @DefaultValue("1h") Duration sweepEvery) {}

    static final String REMIND = "request_link.remind";
    static final String EXPIRED = "request_link.expired";

    @Bean
    JobSchedule reminderSweepSchedule(Settings settings) {
        return new JobSchedule("sweep-reminders", "sweep.reminders", settings.sweepEvery());
    }

    @Bean
    JobSchedule expiredLinkSweepSchedule(Settings settings) {
        return new JobSchedule("sweep-expired-links", "sweep.expired_links", settings.sweepEvery());
    }

    @Bean
    JobHandler reminderSweep(JdbcClient jdbc, Settings settings) {
        return JobHandler.of(
                "sweep.reminders",
                job -> jdbc.sql("select sweep_reminders(:first, :every, :max)")
                        .param("first", (int) settings.firstReminderAfter().toSeconds())
                        .param("every", (int) settings.reminderEvery().toSeconds())
                        .param("max", settings.maxReminders())
                        .query(Integer.class)
                        .single());
    }

    @Bean
    JobHandler expiredLinkSweep(JdbcClient jdbc) {
        return JobHandler.of(
                "sweep.expired_links",
                job -> jdbc.sql("select sweep_expired_links()")
                        .query(Integer.class)
                        .single());
    }

    /** Sends reminder number {@code reminder} for a request link, if it is still needed. */
    @Bean
    JobHandler reminderHandler(
            RequestLinkRepository links,
            RequirementRepository requirements,
            WorkGate work,
            InformationViews views,
            RequestLinkService linkService,
            OrganizationAccess organizations,
            SecretBox box,
            OutgoingEmail outgoing,
            ApplicationEventPublisher events,
            AuditLog audit,
            Clock clock) {
        return JobHandler.of(REMIND, job -> {
            UUID linkId = UUID.fromString(JobWorker.text(job.payload(), "requestLinkId"));
            int number = job.payload().get("reminder").asInt();
            UUID org = job.organizationId();
            OffsetDateTime now = OffsetDateTime.now(clock);
            var link = links.findForUpdate(org, linkId).orElse(null);
            if (link == null
                    || link.revokedAt() != null
                    || !link.expiresAt().isAfter(now)
                    || link.remindersSent() != number - 1) {
                return; // revoked, expired, or this reminder already went out
            }
            var target = work.find(org, link.workId()).orElse(null);
            if (target == null || target.finished()) {
                return;
            }
            var covered = links.requirementIds(List.of(linkId)).getOrDefault(linkId, List.of());
            var rows = requirements.byIds(covered);
            var loaded = views.load(rows);
            List<String> outstanding = rows.stream()
                    .filter(row -> row.required())
                    .filter(row -> {
                        var state = loaded.state(row);
                        return state == Completeness.RequirementState.MISSING
                                || state == Completeness.RequirementState.REJECTED;
                    })
                    .map(RequirementRepository.RequirementRow::title)
                    .toList();
            if (outstanding.isEmpty()) {
                return; // everything asked for has been answered
            }
            var sealed = links.sealedToken(linkId).orElse(null);
            if (sealed == null) {
                return;
            }
            String token = new String(
                    box.open(
                            new SecretBox.Sealed(sealed.keyId(), sealed.ciphertext()),
                            RequestLinkService.tokenContext(linkId)),
                    StandardCharsets.UTF_8);
            outgoing.queue(
                    linkService.reminderEmail(
                            link.recipientEmail(),
                            link.recipientName(),
                            organizations.organizationName(org),
                            target.title(),
                            token,
                            outstanding,
                            link.expiresAt()),
                    org);
            links.recordReminder(linkId, number, now);
            audit.record(AuditLog.Event.of("work.request_link.reminded", org, null)
                    .resource("request_link", linkId)
                    .detail("reminder", number));
            // The work module records this as an automated action (execution) in this transaction.
            events.publishEvent(new InformationEvents.ReminderSent(
                    org,
                    link.workId(),
                    linkId,
                    number,
                    ClientRequestService.mask(link.recipientEmail()),
                    outstanding.size()));
        });
    }

    /** A link expired: erase its token copy and raise an exception if required items are missing. */
    @Bean
    JobHandler expiredLinkHandler(
            RequestLinkRepository links,
            RequirementRepository requirements,
            WorkGate work,
            InformationViews views,
            ApplicationEventPublisher events,
            Clock clock) {
        return JobHandler.of(EXPIRED, job -> {
            UUID linkId = UUID.fromString(JobWorker.text(job.payload(), "requestLinkId"));
            UUID org = job.organizationId();
            OffsetDateTime now = OffsetDateTime.now(clock);
            var link = links.findForUpdate(org, linkId).orElse(null);
            if (link == null
                    || link.expiryHandledAt() != null
                    || link.expiresAt().isAfter(now)) {
                return;
            }
            links.markExpiryHandled(linkId, now);
            var target = work.find(org, link.workId()).orElse(null);
            if (target == null || target.finished()) {
                return;
            }
            var rows = requirements.byIds(links.requirementIds(List.of(linkId)).getOrDefault(linkId, List.of()));
            var loaded = views.load(rows);
            long missing = rows.stream()
                    .filter(row -> row.required())
                    .filter(row -> loaded.state(row) == Completeness.RequirementState.MISSING
                            || loaded.state(row) == Completeness.RequirementState.REJECTED)
                    .count();
            if (missing > 0) {
                // The work module raises the exception in this transaction.
                events.publishEvent(new InformationEvents.RequestExpiredIncomplete(
                        org, link.workId(), linkId, ClientRequestService.mask(link.recipientEmail()), missing));
            }
        });
    }
}
