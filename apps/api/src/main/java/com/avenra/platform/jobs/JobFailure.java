package com.avenra.platform.jobs;

/**
 * How a handler reports a failure (Guidelines §103). Anything else thrown counts as retryable,
 * because an unexpected error is more often transient than not and retries are bounded.
 */
public abstract sealed class JobFailure extends RuntimeException
        permits JobFailure.Retryable, JobFailure.NonRetryable, JobFailure.HumanRequired {

    private static final long serialVersionUID = 1L;

    private JobFailure(String message, Throwable cause) {
        super(message, cause, false, false);
    }

    /** A temporary problem (network, rate limit, provider outage): try again later. */
    public static final class Retryable extends JobFailure {
        private static final long serialVersionUID = 1L;

        public Retryable(String message, Throwable cause) {
            super(message, cause);
        }
    }

    /** A permanent problem (invalid request, credentials, validation): stop. */
    public static final class NonRetryable extends JobFailure {
        private static final long serialVersionUID = 1L;

        public NonRetryable(String message, Throwable cause) {
            super(message, cause);
        }
    }

    /** A person must decide (ambiguity, approval, policy): stop and raise an exception. */
    public static final class HumanRequired extends JobFailure {
        private static final long serialVersionUID = 1L;

        public HumanRequired(String message) {
            super(message, null);
        }
    }
}
