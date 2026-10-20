package com.avenra.agent.tools;

/**
 * A step that did not achieve its effect. {@code retryable} says whether trying again may help
 * (Guidelines §103); the message is shown to people, so it never carries internal details.
 */
public class ToolFailure extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final boolean retryable;

    public ToolFailure(String message, boolean retryable) {
        super(message, null, false, false);
        this.retryable = retryable;
    }

    public boolean retryable() {
        return retryable;
    }
}
