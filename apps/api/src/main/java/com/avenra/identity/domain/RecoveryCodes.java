package com.avenra.identity.domain;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Single-use recovery codes for when the authenticator app is unavailable (ADR-017). Format
 * {@code XXXX-XXXX} from an alphabet without look-alike characters (no 0/O, 1/I/L); about 40 bits
 * each, which is ample for a rate-limited, single-use secret.
 */
public final class RecoveryCodes {

    public static final int COUNT = 10;
    private static final String ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private RecoveryCodes() {}

    public static List<String> generate() {
        List<String> codes = new ArrayList<>(COUNT);
        for (int i = 0; i < COUNT; i++) {
            var code = new StringBuilder(9);
            for (int c = 0; c < 8; c++) {
                if (c == 4) {
                    code.append('-');
                }
                code.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
            }
            codes.add(code.toString());
        }
        return List.copyOf(codes);
    }

    /** Canonical form for hashing and comparison: upper-case, hyphen kept. */
    public static String normalize(String code) {
        return code.strip().toUpperCase(Locale.ROOT);
    }

    public static boolean looksLikeRecoveryCode(String code) {
        return code != null && normalize(code).matches("[A-Z0-9]{4}-[A-Z0-9]{4}");
    }
}
