package com.avenra.platform.jobs;

/**
 * Runs one type of job. {@link #handle} runs inside a database transaction scoped to the job's
 * organization (no user; platform jobs have no organization); the job is marked done in that same
 * transaction, so database effects and completion commit together. Effects outside the database
 * (email, storage) may run again if a worker crashes after them, so they must be idempotent.
 */
public interface JobHandler {

    String type();

    void handle(Job job);

    /** A handler from a function, for handlers declared as beans. */
    static JobHandler of(String type, java.util.function.Consumer<Job> body) {
        return new JobHandler() {
            @Override
            public String type() {
                return type;
            }

            @Override
            public void handle(Job job) {
                body.accept(job);
            }
        };
    }

    /** Whether the payload is erased when the job finishes (for payloads holding secrets). */
    default boolean erasePayloadWhenFinished() {
        return false;
    }
}
