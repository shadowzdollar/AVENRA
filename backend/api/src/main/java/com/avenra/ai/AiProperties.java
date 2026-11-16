package com.avenra.ai;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * Settings for the AI service and AI spending (ADR-029, ADR-030).
 *
 * @param url where the AI service listens (loopback or the private network only)
 * @param serviceToken the shared secret presented to the AI service; never logged
 * @param timeout longest a single call may take
 * @param dailyCallLimit most AI calls per organization per UTC day
 */
@Validated
@ConfigurationProperties("avenra.ai")
public record AiProperties(
        @NotNull @DefaultValue("http://127.0.0.1:8090") URI url,
        @NotNull @Size(min = 32) String serviceToken,
        @NotNull @DefaultValue("150s") Duration timeout,
        @Min(0) @DefaultValue("500") int dailyCallLimit) {

    @Override
    public String toString() {
        return "AiProperties[url=" + url + ", timeout=" + timeout + ", dailyCallLimit=" + dailyCallLimit + "]";
    }
}
