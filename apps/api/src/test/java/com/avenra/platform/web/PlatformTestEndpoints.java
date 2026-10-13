package com.avenra.platform.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Test-only endpoints that exercise the platform error handling. They exist only on the test
 * classpath, under {@code /__test}, with their own permissive security chain.
 */
@RestController
@RequestMapping("/__test")
class PlatformTestEndpoints {

    static final String SECRET_IN_EXCEPTION = "boom-secret-Z9xQ";

    private final JdbcTemplate jdbc;

    PlatformTestEndpoints(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Touches the database, so tracing tests can see a SQL span inside the HTTP span. */
    @GetMapping("/db")
    Integer db() {
        return jdbc.queryForObject("select 1", Integer.class);
    }

    record Echo(@NotBlank @Size(max = 20) String name) {}

    @PostMapping("/echo")
    Echo echo(@Valid @RequestBody Echo echo) {
        return echo;
    }

    @GetMapping("/boom")
    String boom() {
        throw new IllegalStateException("Internal failure involving " + SECRET_IN_EXCEPTION);
    }

    @Configuration(proxyBeanMethods = false)
    static class TestEndpointSecurity {

        @Bean
        @Order(0)
        SecurityFilterChain testEndpointsSecurity(HttpSecurity http) {
            return http.securityMatcher("/__test/**")
                    .csrf(AbstractHttpConfigurer::disable)
                    .authorizeHttpRequests(requests -> requests.anyRequest().permitAll())
                    .build();
        }
    }
}
