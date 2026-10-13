package com.avenra.platform;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
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
 */
@Validated
@ConfigurationProperties("avenra")
public record AvenraProperties(
        @NotNull Environment environment,
        @Valid @DefaultValue Web web) {

    public enum Environment {
        LOCAL,
        DEVELOPMENT,
        STAGING,
        PRODUCTION
    }

    /**
     * @param allowedOrigins browser origins allowed to call the API (CORS); explicit origins only
     * @param maxRequestBodySize largest accepted request body
     */
    public record Web(
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
}
