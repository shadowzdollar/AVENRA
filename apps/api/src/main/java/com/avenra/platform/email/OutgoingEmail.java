package com.avenra.platform.email;

import com.avenra.platform.crypto.SecretBox;
import com.avenra.platform.jobs.JobQueue;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

/**
 * Queues email durably (ADR-025): each message becomes an {@code email.send} job in the caller's
 * transaction, so it is sent exactly when the change commits and survives crashes. The message,
 * which may hold a single-use link, is encrypted at rest and erased once the job finishes.
 */
@Component
public class OutgoingEmail {

    static final String JOB_TYPE = "email.send";
    static final int ATTEMPTS = 8;

    /** The job payload: only the category is readable without the key. */
    record Payload(String messageId, String category, String keyId, String sealed) {}

    private final JobQueue jobs;
    private final SecretBox box;
    private final JsonMapper json;

    OutgoingEmail(JobQueue jobs, SecretBox box, JsonMapper json) {
        this.jobs = jobs;
        this.box = box;
        this.json = json;
    }

    /**
     * @param organizationId the organization the email is sent for, or {@code null} for account
     *     email; it must be the organization the transaction acts in
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void queue(EmailMessage message, @Nullable UUID organizationId) {
        String messageId = UUID.randomUUID().toString();
        var sealed = box.seal(json.writeValueAsBytes(message), associatedData(messageId));
        var payload = new Payload(
                messageId,
                message.category(),
                sealed.keyId(),
                Base64.getEncoder().encodeToString(sealed.ciphertext()));
        jobs.enqueue(JobQueue.Request.of(JOB_TYPE, organizationId, payload)
                .idempotencyKey(messageId)
                .maxAttempts(ATTEMPTS)
                .delay(Duration.ZERO));
    }

    EmailMessage open(Payload payload) {
        byte[] plain = box.open(
                new SecretBox.Sealed(payload.keyId(), Base64.getDecoder().decode(payload.sealed())),
                associatedData(payload.messageId()));
        return json.readValue(new String(plain, StandardCharsets.UTF_8), EmailMessage.class);
    }

    private static String associatedData(String messageId) {
        return "email:" + messageId;
    }
}
