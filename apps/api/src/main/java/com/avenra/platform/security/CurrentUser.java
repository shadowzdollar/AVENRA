package com.avenra.platform.security;

import java.util.Optional;
import java.util.UUID;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * The authenticated person behind the current request, established server-side from the session
 * cookie (ADR-013). Never derived from anything the client sends in the request body or path.
 *
 * @param userId the user
 * @param sessionId the session the request authenticated with
 */
public record CurrentUser(UUID userId, UUID sessionId) {

    public static Optional<CurrentUser> find() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getPrincipal() instanceof CurrentUser user
                ? Optional.of(user)
                : Optional.empty();
    }

    /** The current user; only call from operations that require authentication. */
    public static CurrentUser require() {
        return find().orElseThrow(() -> new IllegalStateException("No authenticated user in this request"));
    }
}
