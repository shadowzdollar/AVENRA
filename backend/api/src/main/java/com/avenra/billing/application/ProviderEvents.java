package com.avenra.billing.application;

import com.avenra.billing.BillingProperties;
import com.avenra.billing.infrastructure.BillingRepository;
import com.avenra.platform.jobs.JobHandler;
import com.avenra.platform.jobs.JobQueue;
import com.avenra.platform.tenancy.TenantScope;
import com.avenra.platform.tenancy.TenantTransactions;
import com.avenra.platform.web.ApiException;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Clock;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.json.JsonMapper;

/**
 * Provider events in (ADR-037): a signed webhook, or the fake provider completing a checkout. Both
 * queue the event as a job of its organization, keyed by provider and event id, so it is applied
 * once even when delivered again; the job applies it through the state machine.
 */
@Configuration(proxyBeanMethods = false)
public class ProviderEvents {

    static final String APPLY = "billing.event";

    private static final Logger log = LoggerFactory.getLogger(ProviderEvents.class);

    private final BillingProperties properties;
    private final BillingRepository repository;
    private final TenantTransactions transactions;
    private final JobQueue jobs;
    private final JsonMapper json;
    private final Clock clock;

    ProviderEvents(
            BillingProperties properties,
            BillingRepository repository,
            TenantTransactions transactions,
            JobQueue jobs,
            JsonMapper json,
            Clock clock) {
        this.properties = properties;
        this.repository = repository;
        this.transactions = transactions;
        this.jobs = jobs;
        this.json = json;
        this.clock = clock;
    }

    /**
     * A webhook from the provider. The signature is checked over the raw body before anything else;
     * only then is the organization named in the event trusted, as the provider acting for the
     * platform.
     */
    public void receive(String provider, String signature, byte[] body, ProviderEvent event) {
        if (properties.provider().equals("none") || !properties.provider().equals(provider)) {
            throw ApiException.notFound();
        }
        if (!WebhookSignature.valid(properties.webhookSecret(), signature, body, clock.instant())) {
            throw new ApiException(
                    "BILLING_SIGNATURE_INVALID", HttpStatus.UNAUTHORIZED, "The event signature is not valid.");
        }
        transactions.runWithoutResult(TenantScope.system(event.organizationId()), () -> {
            if (repository.find(event.organizationId()).isEmpty()) {
                // Retrying will not help; answer so the provider stops, and keep a trace.
                log.atWarn()
                        .addKeyValue("billing.event_id", event.id())
                        .log("Billing event for an unknown organization ignored");
                return;
            }
            queue(event);
        });
    }

    /** Queues an event in the current transaction, which must act in the event's organization. */
    void queue(ProviderEvent event) {
        jobs.enqueue(JobQueue.Request.of(APPLY, event.organizationId(), Map.of("event", json.writeValueAsString(event)))
                .idempotencyKey("billing-event:" + event.provider() + ":" + event.id()));
    }

    @Bean
    JobHandler billingEventHandler(Subscriptions subscriptions, MeterRegistry meters) {
        return JobHandler.of(APPLY, job -> {
            var event = json.readValue(job.payload().path("event").asString(), ProviderEvent.class);
            if (!event.organizationId().equals(job.organizationId())) {
                throw new IllegalStateException("billing event queued for another organization");
            }
            var outcome = subscriptions.apply(event);
            meters.counter("avenra.billing.events", "type", event.type().code(), "outcome", outcome.name())
                    .increment();
        });
    }
}
