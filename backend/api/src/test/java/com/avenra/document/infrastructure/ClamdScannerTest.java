package com.avenra.document.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.avenra.document.application.MalwareScanner;
import org.junit.jupiter.api.Test;

/** Only an explicit verdict counts; anything else fails closed (ADR-021). */
class ClamdScannerTest {

    @Test
    void readsVerdicts() {
        assertThat(ClamdScanner.interpret("stream: OK").infected()).isFalse();
        var infected = ClamdScanner.interpret("stream: Eicar-Signature FOUND");
        assertThat(infected.infected()).isTrue();
        assertThat(infected.signature()).isEqualTo("Eicar-Signature");
    }

    @Test
    void anythingElseIsNotAVerdict() {
        for (String reply : new String[] {"", "INSTREAM size limit exceeded. ERROR", "stream: OK FOUND?", "PONG"}) {
            assertThatThrownBy(() -> ClamdScanner.interpret(reply))
                    .as(reply)
                    .isInstanceOf(MalwareScanner.ScannerUnavailableException.class);
        }
    }
}
