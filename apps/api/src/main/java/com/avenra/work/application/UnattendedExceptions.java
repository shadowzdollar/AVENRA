package com.avenra.work.application;

import com.avenra.platform.jobs.JobHandler;
import com.avenra.platform.jobs.JobSchedule;
import com.avenra.platform.jobs.JobWorker;
import com.avenra.work.WorkEvents;
import com.avenra.work.domain.ExceptionStatus;
import com.avenra.work.domain.ExceptionType;
import com.avenra.work.infrastructure.ExceptionRepository;
import java.time.Duration;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.simple.JdbcClient;

/**
 * High-severity exceptions nobody picked up are announced once for escalation (ADR-035). A sweep
 * finds them across tenants; a job per exception checks it again in its organization's scope.
 */
@Configuration(proxyBeanMethods = false)
class UnattendedExceptions {

    static final String UNATTENDED = "work.exception_unattended";

    @Bean
    JobSchedule unattendedExceptionsSchedule(@Value("${avenra.work.escalation.sweep-every:1h}") Duration every) {
        return new JobSchedule("sweep-unattended-exceptions", "sweep.unattended_exceptions", every);
    }

    @Bean
    JobHandler unattendedExceptionsSweep(
            JdbcClient jdbc, @Value("${avenra.work.escalation.after:24h}") Duration after) {
        return JobHandler.of(
                "sweep.unattended_exceptions",
                job -> jdbc.sql("select sweep_unattended_exceptions(:seconds)")
                        .param("seconds", (int) after.toSeconds())
                        .query(Integer.class)
                        .single());
    }

    @Bean
    JobHandler unattendedExceptionHandler(ExceptionRepository exceptions, ApplicationEventPublisher events) {
        return JobHandler.of(UNATTENDED, job -> {
            UUID id = UUID.fromString(JobWorker.text(job.payload(), "exceptionId"));
            exceptions
                    .find(job.organizationId(), id)
                    .filter(row -> row.severity() == ExceptionType.Severity.HIGH
                            && row.status() == ExceptionStatus.OPEN
                            && row.assigneeMembershipId() == null)
                    .ifPresent(row -> events.publishEvent(new WorkEvents.ExceptionUnattended(
                            row.organizationId(), row.workId(), row.id(), row.description())));
        });
    }
}
