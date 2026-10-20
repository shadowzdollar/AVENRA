package com.avenra.integration.infrastructure;

import com.avenra.integration.IntegrationProperties;
import com.avenra.integration.domain.AddressPolicy;
import com.avenra.integration.domain.Outcome;
import com.avenra.integration.domain.Signature;
import java.io.IOException;
import java.net.InetAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Clock;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * Sends one signed webhook (ADR-034, §66). The target is checked again right before sending;
 * redirects are not followed and response bodies are discarded.
 */
@Component
public class WebhookSender {

    private final HttpClient http;
    private final IntegrationProperties properties;
    private final Clock clock;

    WebhookSender(IntegrationProperties properties, Clock clock) {
        this.http = HttpClient.newBuilder()
                .connectTimeout(properties.timeout())
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
        this.properties = properties;
        this.clock = clock;
    }

    public Outcome send(String url, String secret, UUID eventId, String eventType, String body) {
        URI target;
        try {
            target = URI.create(url);
            AddressPolicy.check(target, properties.allowLoopbackHttp(), InetAddress::getAllByName);
        } catch (AddressPolicy.AddressRefused refused) {
            return Outcome.fail(null, refused.getMessage());
        } catch (IllegalArgumentException malformed) {
            return Outcome.fail(null, "The address is not valid.");
        }
        long now = clock.instant().getEpochSecond();
        var request = HttpRequest.newBuilder(target)
                .timeout(properties.timeout())
                .header("Content-Type", "application/json")
                .header("User-Agent", "Avenra-Webhooks/1")
                .header("Avenra-Event-Id", eventId.toString())
                .header("Avenra-Event-Type", eventType)
                .header("Avenra-Signature", Signature.header(secret, now, body))
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        try {
            int status =
                    http.send(request, HttpResponse.BodyHandlers.discarding()).statusCode();
            if (status >= 200 && status < 300) {
                return Outcome.ok(status);
            }
            if (status == 408 || status == 429 || status >= 500) {
                return Outcome.retry(status, "The receiver answered " + status + ".");
            }
            return Outcome.fail(status, "The receiver refused the event (" + status + ").");
        } catch (HttpTimeoutException timeout) {
            return Outcome.retry(null, "The receiver did not answer in time.");
        } catch (IOException unreachable) {
            return Outcome.retry(null, "The receiver could not be reached.");
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            return Outcome.retry(null, "The delivery was interrupted.");
        }
    }
}
