package com.avenra.work.domain;

/** What raised an exception (ADR-024), with its default severity. */
public enum ExceptionType {
    JOB_FAILED(Severity.MEDIUM),
    DELIVERY_FAILED(Severity.MEDIUM),
    REQUEST_EXPIRED_INCOMPLETE(Severity.MEDIUM),
    WORK_OVERDUE(Severity.HIGH),
    MALWARE_FOUND(Severity.HIGH),
    HUMAN_REQUIRED(Severity.MEDIUM),
    /** An accepted answer no longer passes its checks (ADR-027). */
    INCONSISTENT_INFORMATION(Severity.HIGH);

    public enum Severity {
        LOW,
        MEDIUM,
        HIGH
    }

    private final Severity severity;

    ExceptionType(Severity severity) {
        this.severity = severity;
    }

    public Severity severity() {
        return severity;
    }
}
