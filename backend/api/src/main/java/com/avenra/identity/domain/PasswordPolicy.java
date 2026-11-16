package com.avenra.identity.domain;

import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * Password rules (ADR-014, NIST SP 800-63B): 12 to 128 characters, any characters, no composition
 * rules; reject commonly used passwords (also with digits or symbols appended), a single repeated
 * character, and the account's own email address.
 */
public final class PasswordPolicy {

    public static final int MIN_LENGTH = 12;
    public static final int MAX_LENGTH = 128;

    private final Set<String> commonPasswords;

    /** @param commonPasswords lower-cased commonly used passwords */
    public PasswordPolicy(Set<String> commonPasswords) {
        this.commonPasswords = Set.copyOf(commonPasswords);
    }

    /** The problem with the password, or empty when it is acceptable. */
    public Optional<String> problem(String password, EmailAddress email) {
        int length = password.codePointCount(0, password.length());
        if (length < MIN_LENGTH) {
            return Optional.of("must be at least " + MIN_LENGTH + " characters");
        }
        if (length > MAX_LENGTH) {
            return Optional.of("must be at most " + MAX_LENGTH + " characters");
        }
        String lower = password.toLowerCase(Locale.ROOT);
        // A common word with digits or symbols appended ("password1234") is as guessable as the word.
        String base = lower.replaceAll("[^\\p{L}]+$", "");
        if (commonPasswords.contains(lower) || (base.length() >= 4 && commonPasswords.contains(base))) {
            return Optional.of("is too common; choose a less predictable password");
        }
        if (lower.codePoints().distinct().count() == 1) {
            return Optional.of("must not repeat a single character");
        }
        if (lower.equals(email.normalized()) || lower.equals(localPart(email.normalized()))) {
            return Optional.of("must not be your email address");
        }
        return Optional.empty();
    }

    private static String localPart(String email) {
        int at = email.indexOf('@');
        return at < 0 ? email : email.substring(0, at);
    }
}
