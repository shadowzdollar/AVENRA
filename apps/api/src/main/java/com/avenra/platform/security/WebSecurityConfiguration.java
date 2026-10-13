package com.avenra.platform.security;

import com.avenra.platform.AvenraProperties;
import com.avenra.platform.web.ErrorResponseWriter;
import com.avenra.platform.web.PlatformErrorCode;
import com.avenra.platform.web.RequestIds;
import jakarta.servlet.DispatcherType;
import java.time.Duration;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * HTTP security baseline (ADR-011): deny by default, stateless, strict headers, explicit CORS.
 * Authentication is added in Phase 2.
 */
@Configuration(proxyBeanMethods = false)
class WebSecurityConfiguration {

    /**
     * Paths reachable without authentication, all {@code GET}. Contract operations listed here must
     * declare {@code x-avenra-permission: public}; {@code ContractConformanceIT} checks both directions.
     */
    static final List<String> PUBLIC_GET_PATHS = List.of("/health/liveness", "/health/readiness", "/api/v1/meta");

    @Bean
    SecurityFilterChain apiSecurity(HttpSecurity http, ErrorResponseWriter errorWriter, AvenraProperties properties) {
        http.cors(config -> config.configurationSource(corsConfigurationSource(properties)))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .headers(headers -> headers.frameOptions(frame -> frame.deny())
                        .contentSecurityPolicy(
                                csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'"))
                        .referrerPolicy(referrer -> referrer.policy(ReferrerPolicy.NO_REFERRER))
                        .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true)
                                .maxAgeInSeconds(Duration.ofDays(365).toSeconds()))
                        .addHeaderWriter(new StaticHeadersWriter(
                                "Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")))
                .authorizeHttpRequests(requests -> requests.dispatcherTypeMatchers(DispatcherType.ERROR)
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, PUBLIC_GET_PATHS.toArray(String[]::new))
                        .permitAll()
                        .anyRequest()
                        .denyAll())
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) ->
                                errorWriter.write(request, response, PlatformErrorCode.AUTHENTICATION_REQUIRED))
                        .accessDeniedHandler((request, response, exception) ->
                                errorWriter.write(request, response, PlatformErrorCode.ACCESS_DENIED)));
        return http.build();
    }

    // Not a bean: Spring MVC already registers a CorsConfigurationSource, which would make
    // injection by type ambiguous.
    private static CorsConfigurationSource corsConfigurationSource(AvenraProperties properties) {
        var config = new CorsConfiguration();
        config.setAllowedOrigins(properties.web().allowedOrigins());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
        config.setAllowedHeaders(List.of("Content-Type", "Authorization", RequestIds.HEADER, "Idempotency-Key"));
        config.setExposedHeaders(List.of(RequestIds.HEADER));
        config.setAllowCredentials(false);
        config.setMaxAge(Duration.ofHours(1));
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
