package com.avenra.agent.tools;

import com.avenra.agent.InformationTools;
import com.avenra.agent.domain.Risk;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * Emails the work's client a request link for the open required items. HIGH: an external side
 * effect, so it needs its own approval. The recipient is the client's recorded address; the model
 * cannot choose it (ADR-033).
 */
@Component
class SendInformationRequestTool implements Tool<SendInformationRequestTool.Input> {

    record Input(String message) {}

    private final InformationTools information;

    SendInformationRequestTool(InformationTools information) {
        this.information = information;
    }

    @Override
    public String name() {
        return "send_information_request";
    }

    @Override
    public String description() {
        return "Email the work's client a secure link asking for the open required items.";
    }

    @Override
    public Risk risk() {
        return Risk.HIGH;
    }

    @Override
    public String permission() {
        return "information.collect";
    }

    @Override
    public String auditAction() {
        return "agent.step.send_information_request";
    }

    @Override
    public Duration timeout() {
        return Duration.ofSeconds(15);
    }

    @Override
    public int maxAttempts() {
        return 3;
    }

    @Override
    public boolean sideEffect() {
        return true;
    }

    @Override
    public Map<String, Object> inputSchema() {
        return Map.of(
                "type",
                "object",
                "required",
                List.of("message"),
                "additionalProperties",
                false,
                "properties",
                Map.of("message", Inputs.string(1000)));
    }

    @Override
    public Input validate(Map<String, Object> raw) {
        Inputs.only(raw, Set.of("message"));
        String message = Inputs.text(raw, "message", 1000, false);
        if (message.contains("http://") || message.contains("https://") || message.contains("@")) {
            throw new ToolInputException("message must not contain links or addresses");
        }
        return new Input(message);
    }

    @Override
    public String describe(Input input) {
        return "Email the client a request for the open required items"
                + (input.message().isEmpty() ? "" : ", with the note: \"" + input.message() + "\"");
    }

    @Override
    public Outcome execute(Context context, Input input) {
        String recipient = context.work().clientEmail();
        if (recipient == null || recipient.isBlank()) {
            throw new ToolFailure("The work's client has no email address to send the request to.", false);
        }
        var open = information.openRequiredRequirements(context.organizationId(), context.workId());
        if (open.isEmpty()) {
            throw new ToolFailure("Nothing is waiting for the client, so no request was sent.", false);
        }
        var id = information.sendRequest(
                context.userId(),
                context.organizationId(),
                context.workId(),
                context.idempotencyKey(),
                recipient,
                input.message(),
                open);
        return new Outcome(
                id, "Sent the client a request for " + open.size() + " item" + (open.size() == 1 ? "" : "s") + ".");
    }

    @Override
    public boolean verify(Context context, Input input, Outcome outcome) {
        String recipient = context.work().clientEmail();
        return recipient != null
                && information.activeRequestTo(
                        context.organizationId(), context.workId(), outcome.resourceId(), recipient);
    }
}
