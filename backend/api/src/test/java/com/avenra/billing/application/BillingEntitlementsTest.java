package com.avenra.billing.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.avenra.platform.entitlements.Entitlements.Limit;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;

/** How use is measured against a limit (ADR-037). */
class BillingEntitlementsTest {

    @Test
    void pendingInvitationsCountAsMembers() {
        var figures = Map.of("members", 3L, "invitations.pending", 2L, "documents.bytes", 10L);
        assertThat(BillingEntitlements.used(figures, Limit.MEMBERS)).isEqualTo(5);
        assertThat(BillingEntitlements.used(figures, Limit.STORAGE_BYTES)).isEqualTo(10);
        assertThat(BillingEntitlements.used(figures, Limit.AI_CALLS_MONTH))
                .as("a figure nobody reports counts as none")
                .isZero();
    }

    @Test
    void signaturesCoverTheExactBodyAndTime() {
        byte[] body = "{\"id\":\"e\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        Instant now = Instant.parse("2026-10-20T12:00:00Z");
        String header = WebhookSignature.sign("secret", now.getEpochSecond(), body);
        assertThat(WebhookSignature.valid("secret", header, body, now)).isTrue();
        assertThat(WebhookSignature.valid("secret", header, body, now.plusSeconds(301)))
                .isFalse();
        assertThat(WebhookSignature.valid("other", header, body, now)).isFalse();
        assertThat(WebhookSignature.valid("", header, body, now))
                .as("no secret, no events")
                .isFalse();
        assertThat(WebhookSignature.valid("secret", "t=x,v1=zz", body, now)).isFalse();
        assertThat(WebhookSignature.valid(
                        "secret", header, "{}".getBytes(java.nio.charset.StandardCharsets.UTF_8), now))
                .isFalse();
    }
}
