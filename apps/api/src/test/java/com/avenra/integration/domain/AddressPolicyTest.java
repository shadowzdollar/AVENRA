package com.avenra.integration.domain;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** Connections may only reach public HTTPS addresses (ADR-034, §63). */
class AddressPolicyTest {

    private static AddressPolicy.Resolver to(String ip) {
        return host -> new InetAddress[] {InetAddress.getByName(ip)};
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "0.0.0.0", "100.64.0.1",
                "224.0.0.1", "255.255.255.255", "198.18.0.1", "::1", "fe80::1", "fc00::1", "::ffff:10.0.0.1"
            })
    void internalAddressesAreRefused(String ip) {
        assertThatThrownBy(() -> AddressPolicy.check(URI.create("https://hooks.example/x"), false, to(ip)))
                .isInstanceOf(AddressPolicy.AddressRefused.class);
    }

    @Test
    void publicHttpsIsAllowedAndPlainHttpIsNot() {
        assertThatCode(() -> AddressPolicy.check(URI.create("https://hooks.example/x"), false, to("203.0.113.10")))
                .doesNotThrowAnyException();
        assertThatThrownBy(() -> AddressPolicy.check(URI.create("http://hooks.example/x"), false, to("203.0.113.10")))
                .hasMessageContaining("HTTPS");
        assertThatThrownBy(
                        () -> AddressPolicy.check(URI.create("https://a:b@hooks.example/x"), false, to("203.0.113.10")))
                .isInstanceOf(AddressPolicy.AddressRefused.class);
    }

    @Test
    void aNameThatResolvesToAnyInternalAddressIsRefused() {
        AddressPolicy.Resolver mixed =
                host -> new InetAddress[] {InetAddress.getByName("203.0.113.10"), InetAddress.getByName("10.0.0.1")};
        assertThatThrownBy(() -> AddressPolicy.check(URI.create("https://hooks.example/x"), false, mixed))
                .isInstanceOf(AddressPolicy.AddressRefused.class);
    }

    @Test
    void loopbackOverHttpOnlyWhenExplicitlyAllowed() {
        assertThatThrownBy(() -> AddressPolicy.check(URI.create("http://localhost:9000/x"), false, to("127.0.0.1")))
                .isInstanceOf(AddressPolicy.AddressRefused.class);
        assertThatCode(() -> AddressPolicy.check(URI.create("http://localhost:9000/x"), true, to("127.0.0.1")))
                .doesNotThrowAnyException();
        assertThatThrownBy(() -> AddressPolicy.check(URI.create("http://hooks.example/x"), true, to("10.0.0.1")))
                .as("only loopback is relaxed")
                .isInstanceOf(AddressPolicy.AddressRefused.class);
    }

    @Test
    void unknownHostsAreRefused() {
        AddressPolicy.Resolver none = host -> {
            throw new UnknownHostException(host);
        };
        assertThatThrownBy(() -> AddressPolicy.check(URI.create("https://nowhere.example/x"), false, none))
                .hasMessageContaining("could not be found");
    }

    @Test
    void signaturesFollowTheDocumentedFormat() throws Exception {
        String header = Signature.header("whsec_test", 1_700_000_000L, "{\"a\":1}");
        javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
        mac.init(new javax.crypto.spec.SecretKeySpec("whsec_test".getBytes(), "HmacSHA256"));
        String expected = java.util.HexFormat.of().formatHex(mac.doFinal("1700000000.{\"a\":1}".getBytes()));
        org.assertj.core.api.Assertions.assertThat(header).isEqualTo("t=1700000000,v1=" + expected);
    }
}
