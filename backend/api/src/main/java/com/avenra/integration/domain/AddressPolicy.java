package com.avenra.integration.domain;

import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Locale;

/**
 * Where connections may send data (ADR-034, §63): HTTPS to public addresses only. The host is
 * resolved and every address checked, at creation and again before each delivery, so a name that
 * later points inside the network is refused too.
 */
public final class AddressPolicy {

    /** Resolves host names; replaceable in tests. */
    @FunctionalInterface
    public interface Resolver {
        InetAddress[] resolve(String host) throws UnknownHostException;
    }

    public static final class AddressRefused extends RuntimeException {

        private static final long serialVersionUID = 1L;

        AddressRefused(String message) {
            super(message, null, false, false);
        }
    }

    private AddressPolicy() {}

    public static void check(URI target, boolean allowLoopbackHttp, Resolver resolver) {
        String scheme = target.getScheme() == null ? "" : target.getScheme().toLowerCase(Locale.ROOT);
        String host = target.getHost();
        if (host == null || host.isBlank() || target.getUserInfo() != null) {
            throw new AddressRefused("The address must have a host name and no user name or password.");
        }
        InetAddress[] addresses;
        try {
            addresses = resolver.resolve(host);
        } catch (UnknownHostException unknown) {
            throw new AddressRefused("The host name could not be found.");
        }
        boolean allLoopback = addresses.length > 0;
        for (InetAddress address : addresses) {
            allLoopback &= address.isLoopbackAddress();
        }
        if (allLoopback && allowLoopbackHttp && (scheme.equals("http") || scheme.equals("https"))) {
            return;
        }
        if (!scheme.equals("https")) {
            throw new AddressRefused("The address must use HTTPS.");
        }
        for (InetAddress address : addresses) {
            if (!isPublic(address)) {
                throw new AddressRefused("The address points to a private or internal network.");
            }
        }
    }

    static boolean isPublic(InetAddress address) {
        if (address.isLoopbackAddress()
                || address.isAnyLocalAddress()
                || address.isLinkLocalAddress()
                || address.isSiteLocalAddress()
                || address.isMulticastAddress()) {
            return false;
        }
        byte[] b = address.getAddress();
        if (address instanceof Inet4Address) {
            int first = b[0] & 0xff;
            int second = b[1] & 0xff;
            return !(first == 0 // this network
                    || (first == 100 && second >= 64 && second <= 127) // carrier-grade NAT
                    || (first == 192 && second == 0 && (b[2] & 0xff) == 0) // protocol assignments
                    || (first == 198 && (second == 18 || second == 19)) // benchmarking
                    || first >= 240); // reserved and broadcast
        }
        if (address instanceof Inet6Address) {
            int first = b[0] & 0xff;
            boolean uniqueLocal = (first & 0xfe) == 0xfc;
            boolean mappedV4 = isMappedIpv4(b);
            return !uniqueLocal && !mappedV4;
        }
        return false;
    }

    private static boolean isMappedIpv4(byte[] b) {
        for (int i = 0; i < 10; i++) {
            if (b[i] != 0) {
                return false;
            }
        }
        return (b[10] & 0xff) == 0xff && (b[11] & 0xff) == 0xff;
    }
}
