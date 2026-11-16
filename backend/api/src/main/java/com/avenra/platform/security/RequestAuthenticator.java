package com.avenra.platform.security;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;

/**
 * Resolves the user behind a request. The platform's security filter calls it; the identity module
 * implements it (session cookies, ADR-013), so the platform never depends on a business module.
 */
public interface RequestAuthenticator {

    Optional<CurrentUser> authenticate(HttpServletRequest request);
}
