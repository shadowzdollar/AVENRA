package com.avenra.billing.application;

import com.avenra.billing.BillingProperties;
import com.avenra.billing.domain.Plan;
import com.avenra.billing.domain.SubscriptionStatus;
import com.avenra.billing.infrastructure.BillingRepository.SubscriptionRow;
import com.avenra.platform.AvenraProperties;
import com.avenra.platform.web.ApiException;
import java.net.URI;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;

/** Chooses the billing provider from {@code avenra.billing.provider} (ADR-037). */
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(BillingProperties.class)
class Providers {

    @Bean
    BillingProvider billingProvider(
            BillingProperties properties, AvenraProperties platform, ProviderEvents events, Clock clock) {
        return switch (properties.provider()) {
            case "fake" -> {
                if (platform.environment() == AvenraProperties.Environment.PRODUCTION) {
                    throw new IllegalStateException("avenra.billing.provider=fake is not allowed in production");
                }
                if (properties.webhookSecret().isEmpty()) {
                    throw new IllegalStateException("avenra.billing.webhook-secret is required for provider fake");
                }
                yield new Fake(events, clock);
            }
            default -> new None();
        };
    }

    /** No provider yet: nothing can be bought, nothing arrives. */
    static final class None implements BillingProvider {

        @Override
        public String name() {
            return "none";
        }

        @Override
        public URI checkout(SubscriptionRow current, Plan plan, URI returnUrl) {
            throw new ApiException(
                    "BILLING_UNAVAILABLE",
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Plans cannot be changed online yet. Please contact us.");
        }

        @Override
        public void cancelAtPeriodEnd(SubscriptionRow current) {
            // Nothing to tell: the cancellation is recorded and takes effect at the period's end.
        }
    }

    /**
     * Completes every checkout at once with a paid month, through the same event path a real
     * provider uses. Local development and tests only.
     */
    static final class Fake implements BillingProvider {

        private final ProviderEvents events;
        private final Clock clock;

        Fake(ProviderEvents events, Clock clock) {
            this.events = events;
            this.clock = clock;
        }

        @Override
        public String name() {
            return "fake";
        }

        @Override
        public URI checkout(SubscriptionRow current, Plan plan, URI returnUrl) {
            OffsetDateTime now = OffsetDateTime.now(clock);
            events.queue(new ProviderEvent(
                    name(),
                    "fake_evt_" + UUID.randomUUID(),
                    ProviderEvent.Type.SUBSCRIPTION_UPDATED,
                    now,
                    current.organizationId(),
                    plan,
                    SubscriptionStatus.ACTIVE,
                    now.plusMonths(1),
                    false,
                    "fake_cus_" + current.organizationId(),
                    "fake_sub_" + current.organizationId()));
            return returnUrl;
        }

        @Override
        public void cancelAtPeriodEnd(SubscriptionRow current) {
            // The fake provider confirms nothing further; the end of the period settles it.
        }
    }
}
