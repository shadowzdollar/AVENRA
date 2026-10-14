package com.avenra.work.application;

import com.avenra.platform.jobs.JobHandler;
import com.avenra.platform.jobs.JobSchedule;
import com.avenra.platform.jobs.JobWorker;
import com.avenra.work.domain.ExceptionType;
import com.avenra.work.infrastructure.WorkRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.simple.JdbcClient;

/** Work past its due date while still open raises one exception per due date (ADR-024). */
@Configuration(proxyBeanMethods = false)
class OverdueWork {

    static final String OVERDUE = "work.overdue";

    @Bean
    JobSchedule overdueSweepSchedule(@Value("${avenra.work.follow-ups.sweep-every:1h}") Duration every) {
        return new JobSchedule("sweep-overdue-work", "sweep.overdue_work", every);
    }

    @Bean
    JobHandler overdueSweep(JdbcClient jdbc) {
        return JobHandler.of(
                "sweep.overdue_work",
                job -> jdbc.sql("select sweep_overdue_work()")
                        .query(Integer.class)
                        .single());
    }

    @Bean
    JobHandler overdueHandler(WorkRepository work, Exceptions exceptions, Clock clock) {
        return JobHandler.of(OVERDUE, job -> {
            UUID workId = UUID.fromString(JobWorker.text(job.payload(), "workId"));
            UUID org = job.organizationId();
            OffsetDateTime now = OffsetDateTime.now(clock);
            var target = work.findForUpdate(org, workId).orElse(null);
            if (target == null
                    || target.status().isFinal()
                    || target.dueAt() == null
                    || target.dueAt().isAfter(now)
                    || target.overdueFlaggedAt() != null) {
                return;
            }
            work.markOverdue(org, workId, now);
            exceptions.raise(
                    org,
                    workId,
                    ExceptionType.WORK_OVERDUE,
                    "\"" + target.title() + "\" was due on " + target.dueAt().toLocalDate()
                            + " and is not finished. Agree a new date or finish the work.",
                    "work",
                    workId + "@" + target.dueAt().toInstant());
        });
    }
}
