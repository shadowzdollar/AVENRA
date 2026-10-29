package com.avenra.billing.application;

import com.avenra.billing.infrastructure.BillingRepository;
import com.avenra.platform.jobs.JobHandler;
import com.avenra.platform.jobs.JobSchedule;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.simple.JdbcClient;

/**
 * Once a day per organization (ADR-037): records its usage figures as append-only usage records
 * and lets time move the subscription (trials ending, cancellations taking effect). A sweep queues
 * one job per organization and day; the job runs in that organization's scope.
 */
@Configuration(proxyBeanMethods = false)
class DailyBilling {

    static final String DAILY = "billing.daily";

    @Bean
    JobSchedule billingDailySchedule(@Value("${avenra.billing.sweep-every:1h}") Duration every) {
        return new JobSchedule("sweep-billing-daily", "sweep.billing_daily", every);
    }

    @Bean
    JobHandler billingDailySweep(JdbcClient jdbc) {
        return JobHandler.of(
                "sweep.billing_daily",
                job -> jdbc.sql("select sweep_billing_daily()")
                        .query(Integer.class)
                        .single());
    }

    @Bean
    JobHandler billingDailyHandler(
            BillingRepository repository, BillingEntitlements entitlements, Subscriptions subscriptions, Clock clock) {
        return JobHandler.of(DAILY, job -> {
            var organizationId = job.organizationId();
            OffsetDateTime now = OffsetDateTime.now(clock);
            LocalDate day = now.withOffsetSameInstant(ZoneOffset.UTC).toLocalDate();
            entitlements
                    .figures(organizationId)
                    .forEach((metric, value) -> repository.insertUsage(organizationId, metric, day, value, now));
            subscriptions.settle(organizationId);
        });
    }
}
