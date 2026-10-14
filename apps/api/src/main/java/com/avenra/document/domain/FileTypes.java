package com.avenra.document.domain;

import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.zip.ZipException;
import java.util.zip.ZipFile;

/**
 * The accepted file types and how each is recognised from its content (ADR-019). The declared
 * content type and the file name never decide the type; the name only chooses between CSV and
 * plain text, which have no signature of their own.
 */
public final class FileTypes {

    /** A recognised, accepted type. */
    public record FileType(String contentType, String extension) {}

    public static final FileType PDF = new FileType("application/pdf", "pdf");
    public static final FileType PNG = new FileType("image/png", "png");
    public static final FileType JPEG = new FileType("image/jpeg", "jpg");
    public static final FileType DOCX =
            new FileType("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx");
    public static final FileType XLSX =
            new FileType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx");
    public static final FileType PPTX =
            new FileType("application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx");
    public static final FileType CSV = new FileType("text/csv", "csv");
    public static final FileType TEXT = new FileType("text/plain", "txt");

    /** Extensions shown to people choosing a file. */
    public static final List<String> ACCEPTED_EXTENSIONS =
            List.of("pdf", "docx", "xlsx", "pptx", "csv", "txt", "png", "jpg", "jpeg");

    private static final byte[] PDF_MAGIC = {'%', 'P', 'D', 'F', '-'};
    private static final byte[] PNG_MAGIC = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n'};
    private static final byte[] JPEG_MAGIC = {(byte) 0xff, (byte) 0xd8, (byte) 0xff};
    private static final byte[] ZIP_MAGIC = {'P', 'K', 3, 4};

    /** OOXML packages list at most a few hundred parts; more is not a document we accept. */
    private static final int MAX_ZIP_ENTRIES = 10_000;

    private FileTypes() {}

    /**
     * Detects the type of a complete file.
     *
     * @param file the uploaded file, already fully written
     * @param declaredName the name the uploader gave, used only to tell CSV from plain text
     * @return the type, or empty when the content is not an accepted type
     */
    public static Optional<FileType> detect(Path file, String declaredName) throws IOException {
        byte[] head = readHead(file, 8);
        if (startsWith(head, PDF_MAGIC)) {
            return Optional.of(PDF);
        }
        if (startsWith(head, PNG_MAGIC)) {
            return Optional.of(PNG);
        }
        if (startsWith(head, JPEG_MAGIC)) {
            return Optional.of(JPEG);
        }
        if (startsWith(head, ZIP_MAGIC)) {
            return ooxml(file);
        }
        if (isText(file)) {
            return Optional.of(declaredName.toLowerCase(Locale.ROOT).endsWith(".csv") ? CSV : TEXT);
        }
        return Optional.empty();
    }

    /**
     * A ZIP is accepted only as an OOXML package: it must contain the content-types part and a main
     * part, and no macros (VBA projects, as in {@code .docm} or {@code .xlsm}).
     */
    private static Optional<FileType> ooxml(Path file) throws IOException {
        try (var zip = new ZipFile(file.toFile())) {
            if (zip.size() > MAX_ZIP_ENTRIES || zip.getEntry("[Content_Types].xml") == null) {
                return Optional.empty();
            }
            boolean macros = zip.stream()
                    .map(entry -> entry.getName().toLowerCase(Locale.ROOT))
                    .anyMatch(name -> name.endsWith("vbaproject.bin") || name.endsWith("vbadata.xml"));
            if (macros) {
                return Optional.empty();
            }
            if (zip.getEntry("word/document.xml") != null) {
                return Optional.of(DOCX);
            }
            if (zip.getEntry("xl/workbook.xml") != null) {
                return Optional.of(XLSX);
            }
            if (zip.getEntry("ppt/presentation.xml") != null) {
                return Optional.of(PPTX);
            }
            return Optional.empty();
        } catch (ZipException malformed) {
            return Optional.empty();
        }
    }

    /** Valid UTF-8 (an optional byte-order mark allowed) without NUL or other control bytes besides tab, CR, LF. */
    private static boolean isText(Path file) throws IOException {
        byte[] content = Files.readAllBytes(file);
        if (content.length == 0) {
            return false;
        }
        for (byte b : content) {
            if ((b >= 0 && b < 0x20 && b != '\t' && b != '\n' && b != '\r') || b == 0x7f) {
                return false;
            }
        }
        try {
            StandardCharsets.UTF_8
                    .newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(content));
            return true;
        } catch (CharacterCodingException notUtf8) {
            return false;
        }
    }

    private static byte[] readHead(Path file, int length) throws IOException {
        try (InputStream in = Files.newInputStream(file)) {
            return in.readNBytes(length);
        }
    }

    private static boolean startsWith(byte[] content, byte[] prefix) {
        if (content.length < prefix.length) {
            return false;
        }
        for (int i = 0; i < prefix.length; i++) {
            if (content[i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }
}
