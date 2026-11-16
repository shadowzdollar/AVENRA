package com.avenra.identity.application;

import com.avenra.identity.domain.EmailAddress;
import com.avenra.identity.domain.PasswordPolicy;
import com.avenra.platform.web.ApiException;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Password hashing and rules (ADR-014). Argon2id at the OWASP-recommended parameters, behind a
 * delegating encoder so stored hashes name their algorithm and can be upgraded later.
 */
@Component
public class Passwords {

    private static final String ARGON2 = "argon2id";

    private final PasswordEncoder encoder;
    private final PasswordPolicy policy;
    /** Compared against when the account does not exist, so timing does not reveal accounts. */
    private final String dummyHash;

    Passwords() {
        // OWASP: m=19 MiB, t=2, p=1; 16-byte salt, 32-byte hash.
        var argon2 = new Argon2PasswordEncoder(16, 32, 1, 19 * 1024, 2);
        this.encoder = new DelegatingPasswordEncoder(ARGON2, Map.of(ARGON2, argon2));
        this.policy = new PasswordPolicy(loadCommonPasswords());
        this.dummyHash = encoder.encode("dummy-password-for-constant-time");
    }

    /** Checks the rules and throws {@code VALIDATION_FAILED} for the given field if they fail. */
    public void requireAcceptable(String field, String password, EmailAddress email) {
        policy.problem(password, email).ifPresent(problem -> {
            throw ApiException.invalid(field, problem);
        });
    }

    public String hash(String password) {
        return encoder.encode(password);
    }

    public boolean matches(String password, String hash) {
        return encoder.matches(password, hash);
    }

    /** Spends the same effort as a real check; call when there is no account to check against. */
    public void burnTime(String password) {
        encoder.matches(password, dummyHash);
    }

    private static Set<String> loadCommonPasswords() {
        try (var reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource("identity/common-passwords.txt").getInputStream(), StandardCharsets.UTF_8))) {
            return reader.lines()
                    .map(line -> line.strip().toLowerCase(Locale.ROOT))
                    .filter(line -> !line.isEmpty())
                    .collect(Collectors.toUnmodifiableSet());
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }
    }
}
