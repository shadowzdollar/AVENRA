package com.avenra.work.application;

import com.avenra.platform.jobs.JobEvents;
import com.avenra.platform.tenancy.TenantScope;
import com.avenra.platform.tenancy.TenantTransactions;
import com.avenra.work.domain.ExceptionType;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Turns tenant jobs that stopped for good into exceptions a person can act on (ADR-024): a dead
 * or failed job, an email that could not be delivered, or a job that needs a decision. Platform
 * jobs (no organization) are visible in metrics and logs only.
 */
@Component
class StoppedJobs {

    private final TenantTransactions transactions;
    private final Exceptions exceptions;

    StoppedJobs(TenantTransactions transactions, Exceptions exceptions) {
        this.transactions = transactions;
        this.exceptions = exceptions;
    }

    @EventListener
    void on(JobEvents.JobStopped stopped) {
        UUID organizationId = stopped.organizationId();
        if (organizationId == null) {
            return;
        }
        UUID workId = uuid(stopped.payload().get("workId"));
        ExceptionType type;
        String description;
        if (stopped.type().equals("email.send")) {
            type = ExceptionType.DELIVERY_FAILED;
            var category = stopped.payload().get("category");
            description = "An email (" + (category == null ? "message" : category.asString())
                    + ") could not be delivered. Check the recipient's address and send it again.";
        } else if (stopped.reason() == JobEvents.Reason.HUMAN_REQUIRED) {
            type = ExceptionType.HUMAN_REQUIRED;
            description = "An automated step needs a decision: " + stopped.message();
        } else {
            type = ExceptionType.JOB_FAILED;
            description = "An automated step (" + stopped.type() + ") stopped: " + stopped.message()
                    + ". It will not be retried; check the work and retry the action by hand.";
        }
        transactions.runWithoutResult(
                TenantScope.system(organizationId),
                () -> exceptions.raise(
                        organizationId,
                        workId,
                        type,
                        description,
                        "job",
                        stopped.jobId().toString()));
    }

    private static @Nullable UUID uuid(tools.jackson.databind.@Nullable JsonNode value) {
        if (value == null || value.isNull()) {
            return null;
        }
        try {
            return UUID.fromString(value.asString());
        } catch (IllegalArgumentException notAnId) {
            return null;
        }
    }
}
