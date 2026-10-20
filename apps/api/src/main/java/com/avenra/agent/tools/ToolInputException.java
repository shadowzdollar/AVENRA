package com.avenra.agent.tools;

/** A step's input does not fit its tool; the step is refused, never run. */
public class ToolInputException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public ToolInputException(String message) {
        super(message, null, false, false);
    }
}
