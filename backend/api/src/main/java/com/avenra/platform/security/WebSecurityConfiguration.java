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
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import tools.jackson.databind.json.JsonMapper;

/**
 * HTTP security (ADR-011, ADR-013): deny by default; server-side session authentication through
 * {@link RequestAuthenticator}; CSRF protection with a double-submit cookie plus an Origin check;
 * strict headers. Authorization beyond "signed in" happens in the application layer, per
 * organization and permission (Guidelines §36).
 */
@Configuration(proxyBeanMethods = false)
class WebSecurityConfiguration {

    /** A method and path pattern reachable without authentication. */
    record Endpoint(HttpMethod method, String path) {}

    /**
     * Everything reachable without authentication. Contract operations listed here must declare
     * {@code x-avenra-permission: public}, and every public contract operation must be listed;
     * {@code ContractConformanceIT} checks both directions.
     */
    static final List<Endpoint> PUBLIC_ENDPOINTS = List.of(
            new Endpoint(HttpMethod.GET, "/health/liveness"),
            new Endpoint(HttpMethod.GET, "/health/readiness"),
            new Endpoint(HttpMethod.GET, "/api/v1/meta"),
            new Endpoint(HttpMethod.GET, "/api/v1/auth/csrf"),
            new Endpoint(HttpMethod.POST, "/api/v1/auth/sign-up"),
            new Endpoint(HttpMethod.POST, "/api/v1/auth/email-verification"),
            new Endpoint(HttpMethod.POST, "/api/v1/auth/email-verification/resend"),
            new Endpoint(HttpMethod.POST, "/api/v1/auth/sign-in"),
            new Endpoint(HttpMethod.POST, "/api/v1/auth/sign-in/mfa"),
            new Endpoint(HttpMethod.POST, "/api/v1/auth/password-reset"),
            new Endpoint(HttpMethod.POST, "/api/v1/auth/password-reset/confirm"),
            // Client request links: the request token is the credential (ADR-020).
            new Endpoint(HttpMethod.GET, "/api/v1/client-requests/current"),
            new Endpoint(HttpMethod.POST, "/api/v1/client-requests/current/requirements/{requirementId}/value"),
            new Endpoint(HttpMethod.POST, "/api/v1/client-requests/current/requirements/{requirementId}/file"),
            // Billing provider events: the signature over the body is the credential (ADR-037).
            new Endpoint(HttpMethod.POST, "/api/v1/billing/providers/{provider}/events"));

    static final String CSRF_COOKIE = "XSRF-TOKEN";
    static final String CSRF_HEADER = "X-XSRF-TOKEN";

    @Bean
    SecurityFilterChain apiSecurity(
            HttpSecurity http,
            ErrorResponseWriter errorWriter,
            AvenraProperties properties,
            RequestAuthenticator authenticator,
            JsonMapper json) {
        var csrfTokens = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokens.setCookieName(CSRF_COOKIE);
        csrfTokens.setHeaderName(CSRF_HEADER);
        csrfTokens.setCookieCustomizer(
                cookie -> cookie.secure(true).sameSite("Strict").path("/"));

        var cors = new CorsFilter(corsConfigurationSource(properties));
        cors.setCorsProcessor(new ErrorFormatCorsProcessor(json));

        http.cors(AbstractHttpConfigurer::disable)
                .addFilterBefore(cors, CsrfFilter.class)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                // The token is read from the header as sent: a single-page app cannot use the
                // per-request masked tokens of the default handler.
                .csrf(csrf -> csrf.csrfTokenRepository(csrfTokens)
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                        // Sent by the provider's servers, not by browsers; signed instead.
                        .ignoringRequestMatchers(PathPatternRequestMatcher.withDefaults()
                                .matcher(HttpMethod.POST, "/api/v1/billing/providers/*/events")))
                .addFilterBefore(new OriginCheckFilter(properties, errorWriter), AnonymousAuthenticationFilter.class)
                .addFilterBefore(new SessionAuthenticationFilter(authenticator), AnonymousAuthenticationFilter.class)
                .headers(headers -> headers.frameOptions(frame -> frame.deny())
                        .contentSecurityPolicy(
                                csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'"))
                        .referrerPolicy(referrer -> referrer.policy(ReferrerPolicy.NO_REFERRER))
                        .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true)
                                .maxAgeInSeconds(Duration.ofDays(365).toSeconds()))
                        .addHeaderWriter(new StaticHeadersWriter(
                                "Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")))
                .authorizeHttpRequests(requests -> {
                    requests.dispatcherTypeMatchers(DispatcherType.ERROR).permitAll();
                    PUBLIC_ENDPOINTS.forEach(endpoint -> requests.requestMatchers(endpoint.method(), endpoint.path())
                            .permitAll());
                    requests.requestMatchers("/api/**").authenticated();
                    requests.anyRequest().denyAll();
                })
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) ->
                                errorWriter.write(request, response, PlatformErrorCode.AUTHENTICATION_REQUIRED))
                        .accessDeniedHandler((request, response, exception) -> errorWriter.write(
                                request,
                                response,
                                exception instanceof CsrfException
                                        ? PlatformErrorCode.CSRF_TOKEN_INVALID
                                        : PlatformErrorCode.ACCESS_DENIED)));
        return http.build();
    }

    // Not a bean: Spring MVC already registers a CorsConfigurationSource, which would make
    // injection by type ambiguous. Browsers use the same origin (ADR-013); CORS remains only for
    // explicitly listed origins, normally none in shared environments.
    private static CorsConfigurationSource corsConfigurationSource(AvenraProperties properties) {
        var config = new CorsConfiguration();
        config.setAllowedOrigins(properties.web().allowedOrigins());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
        config.setAllowedHeaders(List.of("Content-Type", CSRF_HEADER, RequestIds.HEADER, "Idempotency-Key"));
        config.setExposedHeaders(List.of(RequestIds.HEADER));
        config.setAllowCredentials(false);
        config.setMaxAge(Duration.ofHours(1));
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
