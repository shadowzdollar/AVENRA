package com.avenra.billing.application;

import com.avenra.billing.domain.Standing;
import com.avenra.billing.infrastructure.BillingRepository;
import com.avenra.billing.infrastructure.BillingRepository.SubscriptionRow;
import com.avenra.platform.administration.UsageContributor;
import com.avenra.platform.entitlements.Entitlements;
import com.avenra.platform.web.ApiException;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * Plan limits against current use (ADR-037). Use is what the owning modules report (ADR-036), so
 * nothing here counts another module's rows.
 */
@Component
class BillingEntitlements implements Entitlements {

    private final BillingRepository repository;
    private final List<UsageContributor> contributors;
    private final Clock clock;

    BillingEntitlements(BillingRepository repository, List<UsageContributor> contributors, Clock clock) {
        this.repository = repository;
        this.contributors = contributors;
        this.clock = clock;
    }

    @Override
    public void requireRoom(UUID organizationId, Limit limit, long adding) {
        var subscription = repository.find(organizationId).orElse(null);
        if (!inGoodStanding(subscription)) {
            throw ApiException.conflict(
                    "SUBSCRIPTION_INACTIVE",
                    "The organization's subscription is not active, so nothing new can be added. Records stay"
                            + " available; an owner can renew it on the billing page.");
        }
        var allowed = subscription.plan().allowed(limit);
        if (allowed.isPresent() && used(organizationId, limit) + adding > allowed.getAsLong()) {
            throw ApiException.conflict(
                    "PLAN_LIMIT_REACHED",
                    "The " + subscription.plan().displayName() + " plan allows " + allowed.getAsLong() + " for "
                            + Labels.of(limit) + ". An owner can change the plan on the billing page.");
        }
    }

    @Override
    public boolean hasRoom(UUID organizationId, Limit limit, long adding) {
        try {
            requireRoom(organizationId, limit, adding);
            return true;
        } catch (ApiException refused) {
            return false;
        }
    }

    boolean inGoodStanding(@org.jspecify.annotations.Nullable SubscriptionRow subscription) {
        return subscription != null
                && Standing.good(
                        subscription.status(),
                        subscription.trialEndsAt(),
                        subscription.pastDueSince(),
                        OffsetDateTime.now(clock));
    }

    /** Every usage figure of the organization, by key. */
    Map<String, Long> figures(UUID organizationId) {
        var figures = new HashMap<String, Long>();
        for (var contributor : contributors) {
            for (var figure : contributor.usage(organizationId)) {
                figures.put(figure.key(), figure.value());
            }
        }
        return figures;
    }

    long used(UUID organizationId, Limit limit) {
        return used(figures(organizationId), limit);
    }

    /** Pending invitations count as members, so inviting cannot outrun the limit. */
    static long used(Map<String, Long> figures, Limit limit) {
        long used = figures.getOrDefault(limit.code(), 0L);
        return limit == Limit.MEMBERS ? used + figures.getOrDefault("invitations.pending", 0L) : used;
    }
}
