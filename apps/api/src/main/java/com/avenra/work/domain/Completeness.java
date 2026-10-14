package com.avenra.work.domain;

import java.util.Collection;
import org.jspecify.annotations.Nullable;

/**
 * How much of what work requires has been provided and accepted (Guidelines §21, ADR-018). Only
 * required requirements count; optional ones never block completion.
 */
public record Completeness(int required, int accepted, int awaitingReview, int missing, int rejected) {

    /** The state of a requirement, derived from the verification state of its current item. */
    public enum RequirementState {
        MISSING,
        SUBMITTED,
        ACCEPTED,
        REJECTED;

        /** @param verification the current item's verification state, or {@code null} without one */
        public static RequirementState of(@Nullable VerificationState verification) {
            if (verification == null) {
                return MISSING;
            }
            return switch (verification) {
                case PENDING -> SUBMITTED;
                case ACCEPTED -> ACCEPTED;
                case REJECTED -> REJECTED;
            };
        }
    }

    public enum VerificationState {
        PENDING,
        ACCEPTED,
        REJECTED
    }

    public record Entry(boolean required, RequirementState state) {}

    public static Completeness of(Collection<Entry> requirements) {
        int required = 0;
        int accepted = 0;
        int awaiting = 0;
        int missing = 0;
        int rejected = 0;
        for (Entry entry : requirements) {
            if (!entry.required()) {
                continue;
            }
            required++;
            switch (entry.state()) {
                case ACCEPTED -> accepted++;
                case SUBMITTED -> awaiting++;
                case MISSING -> missing++;
                case REJECTED -> rejected++;
            }
        }
        return new Completeness(required, accepted, awaiting, missing, rejected);
    }

    public boolean complete() {
        return accepted == required;
    }
}
