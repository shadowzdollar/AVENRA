package com.avenra.document.domain;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Makes an uploader-supplied file name safe to store and to send back in a
 * {@code Content-Disposition} header: no paths, no control characters, bounded length, and an
 * extension that matches the detected type.
 */
public final class FileNames {

    private static final int MAX_LENGTH = 150;

    private FileNames() {}

    public static String sanitize(String declared, FileTypes.FileType type) {
        String name = declared == null ? "" : Normalizer.normalize(declared, Normalizer.Form.NFC);
        int slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
        name = name.substring(slash + 1);
        var cleaned = new StringBuilder();
        name.codePoints()
                .filter(c -> !Character.isISOControl(c) && c != '"' && c != ';' && Character.isDefined(c))
                .forEach(cleaned::appendCodePoint);
        String base = cleaned.toString().strip();
        int dot = base.lastIndexOf('.');
        if (dot >= 0) {
            base = base.substring(0, dot);
        }
        base = base.replaceAll("^\\.+", "").strip();
        if (base.isEmpty()) {
            base = "document";
        }
        if (base.length() > MAX_LENGTH) {
            base = base.substring(
                    0, base.offsetByCodePoints(0, Math.min(MAX_LENGTH, base.codePointCount(0, base.length()))));
        }
        return base + "." + extensionFor(declared, type);
    }

    /** Keeps {@code .jpeg} when that was the uploader's spelling; otherwise the type's extension. */
    private static String extensionFor(String declared, FileTypes.FileType type) {
        if (type == FileTypes.JPEG
                && declared != null
                && declared.toLowerCase(Locale.ROOT).endsWith(".jpeg")) {
            return "jpeg";
        }
        return type.extension();
    }
}
