package com.avenra.identity.application;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * Identity settings (ADR-013, ADR-017).
 *
 * @param sessionIdleTimeout a session ends after this long without requests
 * @param sessionAbsoluteLifetime a session ends this long after sign-in, regardless of activity
 * @param emailVerificationValidity how long an email verification link works
 * @param passwordResetValidity how long a password reset link works
 * @param mfaChallengeValidity how long the second sign-in step may take
 * @param totpIssuer the name authenticator apps show
 */
@Validated
@ConfigurationProperties("avenra.identity")
public record IdentityProperties(
        @NotNull @DefaultValue("4h") Duration sessionIdleTimeout,
        @NotNull @DefaultValue("7d") Duration sessionAbsoluteLifetime,
        @NotNull @DefaultValue("24h") Duration emailVerificationValidity,
        @NotNull @DefaultValue("30m") Duration passwordResetValidity,
        @NotNull @DefaultValue("5m") Duration mfaChallengeValidity,
        @NotBlank @DefaultValue("Avenra") String totpIssuer) {}
