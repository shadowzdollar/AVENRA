package com.avenra.identity;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/** Read access to people's accounts for other modules (Guidelines §128: modules own their data). */
public interface UserDirectory {

    Optional<UserSummary> find(UUID userId);

    Map<UUID, UserSummary> findAll(Collection<UUID> userIds);

    /** The comparison form of an email address, exactly as identity stores it. */
    static String normalizeEmail(String email) {
        return com.avenra.identity.domain.EmailAddress.of(email).normalized();
    }

    /** @param id the user @param email as entered at sign-up @param emailVerified whether verified */
    record UserSummary(UUID id, String email, String emailNormalized, String displayName, boolean emailVerified) {}
}
