package com.avenra.document.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class FileNamesTest {

    @Test
    void stripsPathsControlCharactersAndHeaderSyntax() {
        assertThat(FileNames.sanitize("../../etc/passwd.pdf", FileTypes.PDF)).isEqualTo("passwd.pdf");
        assertThat(FileNames.sanitize("C:\\Users\\x\\Q1 \"final\";.pdf", FileTypes.PDF))
                .isEqualTo("Q1 final.pdf");
        assertThat(FileNames.sanitize("a\r\nSet-Cookie: x.pdf", FileTypes.PDF)).isEqualTo("aSet-Cookie: x.pdf");
        assertThat(FileNames.sanitize("...", FileTypes.PDF)).isEqualTo("document.pdf");
        assertThat(FileNames.sanitize(null, FileTypes.TEXT)).isEqualTo("document.txt");
    }

    @Test
    void theExtensionAlwaysMatchesTheDetectedType() {
        assertThat(FileNames.sanitize("invoice.exe", FileTypes.PDF)).isEqualTo("invoice.pdf");
        assertThat(FileNames.sanitize("photo.JPEG", FileTypes.JPEG)).isEqualTo("photo.jpeg");
        assertThat(FileNames.sanitize("photo.png", FileTypes.JPEG)).isEqualTo("photo.jpg");
        assertThat(FileNames.sanitize("x".repeat(500) + ".pdf", FileTypes.PDF)).hasSize(154);
    }
}
