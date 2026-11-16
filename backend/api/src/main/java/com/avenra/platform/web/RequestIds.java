package com.avenra.platform.web;

import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;
import java.util.regex.Pattern;

/** Request correlation ids (Guidelines §34): one per request, in logs, headers and error bodies. */
public final class RequestIds {

    public static final String HEADER = "X-Request-Id";
    public static final String MDC_KEY = "requestId";

    static final String ATTRIBUTE = RequestIds.class.getName();

    /**
     * Inbound ids are accepted only in this conservative format, so a client cannot inject line
     * breaks or other content into logs through the header.
     */
    private static final Pattern ACCEPTED = Pattern.compile("[A-Za-z0-9._-]{8,128}");

    private RequestIds() {}

    /** The id assigned to this request, or a fresh one if the request bypassed the filter. */
    public static String current(HttpServletRequest request) {
        return request.getAttribute(ATTRIBUTE) instanceof String id ? id : generate();
    }

    static String resolve(String inbound) {
        return inbound != null && ACCEPTED.matcher(inbound).matches() ? inbound : generate();
    }

    private static String generate() {
        return UUID.randomUUID().toString();
    }
}
