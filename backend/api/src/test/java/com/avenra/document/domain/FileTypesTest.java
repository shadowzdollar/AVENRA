package com.avenra.document.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/** Type detection by signature (ADR-019): names and declared types never decide. */
class FileTypesTest {

    @TempDir
    Path dir;

    private FileTypes.FileType detect(byte[] content, String name) throws IOException {
        Path file = Files.write(dir.resolve("upload"), content);
        return FileTypes.detect(file, name).orElse(null);
    }

    @Test
    void recognisesEachAcceptedType() throws IOException {
        assertThat(detect("%PDF-1.4 x".getBytes(StandardCharsets.US_ASCII), "a"))
                .isEqualTo(FileTypes.PDF);
        assertThat(detect(new byte[] {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n'}, "a"))
                .isEqualTo(FileTypes.PNG);
        assertThat(detect(new byte[] {(byte) 0xff, (byte) 0xd8, (byte) 0xff, (byte) 0xe0}, "a"))
                .isEqualTo(FileTypes.JPEG);
        assertThat(detect(zip("[Content_Types].xml", "word/document.xml"), "a")).isEqualTo(FileTypes.DOCX);
        assertThat(detect(zip("[Content_Types].xml", "xl/workbook.xml"), "a")).isEqualTo(FileTypes.XLSX);
        assertThat(detect(zip("[Content_Types].xml", "ppt/presentation.xml"), "a"))
                .isEqualTo(FileTypes.PPTX);
        assertThat(detect("a,b\n1,2".getBytes(StandardCharsets.UTF_8), "Figures.CSV"))
                .isEqualTo(FileTypes.CSV);
        assertThat(detect("Grüße\r\n\tok".getBytes(StandardCharsets.UTF_8), "notes"))
                .isEqualTo(FileTypes.TEXT);
    }

    @Test
    void rejectsEverythingElse() throws IOException {
        assertThat(detect(new byte[] {'M', 'Z', (byte) 0x90, 0}, "invoice.pdf")).isNull();
        assertThat(detect(zip("payload.exe"), "a.docx")).isNull();
        assertThat(detect(zip("[Content_Types].xml", "word/vbaProject.bin"), "a.docm"))
                .isNull();
        assertThat(detect(new byte[] {'P', 'K', 3, 4, 1, 2, 3}, "broken.docx")).isNull();
        assertThat(detect(new byte[] {'a', 0, 'b'}, "a.txt")).isNull();
        assertThat(detect(new byte[] {(byte) 0xc3, (byte) 0x28}, "a.txt")).isNull();
        assertThat(detect("<script>\u001b</script>".getBytes(StandardCharsets.UTF_8), "a.txt"))
                .isNull();
        assertThat(detect(new byte[0], "a.txt")).isNull();
    }

    private static byte[] zip(String... entries) throws IOException {
        var out = new ByteArrayOutputStream();
        try (var zip = new ZipOutputStream(out)) {
            for (String entry : entries) {
                zip.putNextEntry(new ZipEntry(entry));
                zip.write(1);
                zip.closeEntry();
            }
        }
        return out.toByteArray();
    }
}
