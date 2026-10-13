package com.avenra.platform;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.util.List;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.util.unit.DataSize;
import org.springframework.validation.annotation.Validated;

/**
 * Typed, validated Avenra configuration (Guidelines §91). Invalid or missing values stop the
 * application at startup instead of failing later at runtime.
 *
 * @param environment the deployment environment; set by the active Spring profile
 * @param web HTTP-layer settings
 * @param crypto application-level encryption keys (Guidelines §69)
 * @param email outgoing email settings (ADR-015)
 */
@Validated
@ConfigurationProperties("avenra")
public record AvenraProperties(
        @NotNull Environment environment,
        @Valid @DefaultValue Web web,
        @Valid @NotNull Crypto crypto,
        @Valid @NotNull Email email) {

    public enum Environment {
        LOCAL,
        DEVELOPMENT,
        STAGING,
        PRODUCTION
    }

    /**
     * @param publicBaseUrl the address people use to reach Avenra; used in links sent by email
     * @param allowedOrigins browser origins allowed to call the API (CORS); explicit origins only
     * @param maxRequestBodySize largest accepted request body
     */
    public record Web(
            @NotNull @DefaultValue("http://localhost:3000") URI publicBaseUrl,
            @DefaultValue List<@NotBlank String> allowedOrigins,
            @NotNull @DefaultValue("1MB") DataSize maxRequestBodySize) {

        public Web {
            allowedOrigins = List.copyOf(allowedOrigins);
        }

        @AssertTrue(message = "must list explicit origins; wildcards are not permitted (ADR-011)")
        public boolean isAllowedOriginsExplicit() {
            return allowedOrigins.stream().noneMatch(origin -> origin.contains("*"));
        }

        @AssertTrue(message = "must be greater than zero")
        public boolean isMaxRequestBodySizePositive() {
            return maxRequestBodySize == null || maxRequestBodySize.toBytes() > 0;
        }
    }

    /**
     * @param keys encryption keys by id, each 32 random bytes in base64; keep retired keys until
     *     their data is re-encrypted
     * @param activeKeyId the key used for new data
     */
    public record Crypto(
            @NotEmpty Map<String, @NotBlank String> keys,
            @NotBlank String activeKeyId) {

        public Crypto {
            keys = Map.copyOf(keys);
        }
    }

    /** @param from sender address of transactional email */
    public record Email(@NotBlank String from) {}
}
