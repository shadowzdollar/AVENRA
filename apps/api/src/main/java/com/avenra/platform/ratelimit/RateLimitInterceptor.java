package com.avenra.platform.ratelimit;

import com.avenra.platform.security.CurrentUser;
import com.avenra.platform.web.ContractOperations;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Applies the rate-limit policy each contract operation declares in {@code x-avenra-rate-limit}
 * (ADR-016). The handler method name is the contract's operationId, because controllers implement
 * the generated interfaces. Signed-in callers are limited per user, anonymous callers per network
 * address. Credential endpoints add per-account limits in their services.
 */
@Configuration(proxyBeanMethods = false)
class RateLimitInterceptor implements HandlerInterceptor, WebMvcConfigurer {

    private final RateLimiter limiter;
    private final ContractOperations contract;

    RateLimitInterceptor(RateLimiter limiter, ContractOperations contract) {
        this.limiter = limiter;
        this.contract = contract;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(this).addPathPatterns("/api/**");
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (handler instanceof HandlerMethod method) {
            contract.find(method.getMethod().getName()).ifPresent(operation -> {
                String subject = CurrentUser.find()
                        .map(user -> "user:" + user.userId())
                        .orElseGet(() -> "ip:" + request.getRemoteAddr());
                limiter.consume(operation.rateLimit(), subject);
            });
        }
        return true;
    }
}
