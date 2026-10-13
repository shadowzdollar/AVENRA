package com.avenra.identity.domain;

import java.text.Normalizer;
import java.util.Locale;

/**
 * An email address as entered, plus the normalized form used for uniqueness and lookups: trimmed,
 * Unicode-normalized (NFC) and lower-cased. The local part is not otherwise altered (no dot or
 * plus-tag folding), because providers differ.
 *
 * @param display the address as the person typed it (trimmed)
 * @param normalized the comparison key
 */
public record EmailAddress(String display, String normalized) {

    public static EmailAddress of(String input) {
        String trimmed = Normalizer.normalize(input.strip(), Normalizer.Form.NFC);
        return new EmailAddress(trimmed, trimmed.toLowerCase(Locale.ROOT));
    }
}
