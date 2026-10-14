package com.avenra.platform.email;

import com.avenra.platform.jobs.Job;
import com.avenra.platform.jobs.JobFailure;
import com.avenra.platform.jobs.JobHandler;
import jakarta.mail.AuthenticationFailedException;
import jakarta.mail.SendFailedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailParseException;
import org.springframework.mail.MailPreparationException;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

/**
 * Delivers queued email (ADR-025). Rejected recipients, bad credentials and malformed messages are
 * permanent; everything else (connection problems, temporary SMTP errors) is retried with backoff.
 * Delivery happens before the job is marked done, so a crash in between can send a message twice;
 * that is preferred to losing it.
 */
@Component
class EmailJobHandler implements JobHandler {

    private static final Logger log = LoggerFactory.getLogger(EmailJobHandler.class);

    private final EmailSender sender;
    private final OutgoingEmail outgoing;
    private final JsonMapper json;

    EmailJobHandler(EmailSender sender, OutgoingEmail outgoing, JsonMapper json) {
        this.sender = sender;
        this.outgoing = outgoing;
        this.json = json;
    }

    @Override
    public String type() {
        return OutgoingEmail.JOB_TYPE;
    }

    @Override
    public boolean erasePayloadWhenFinished() {
        return true;
    }

    @Override
    public void handle(Job job) {
        var payload = json.treeToValue(job.payload(), OutgoingEmail.Payload.class);
        EmailMessage message;
        try {
            message = outgoing.open(payload);
        } catch (RuntimeException unreadable) {
            throw new JobFailure.NonRetryable("The queued email cannot be decrypted", null);
        }
        try {
            sender.send(message);
        } catch (RuntimeException failure) {
            if (permanent(failure)) {
                throw new JobFailure.NonRetryable("The email was rejected (" + payload.category() + ")", null);
            }
            throw new JobFailure.Retryable("Email delivery failed temporarily (" + payload.category() + ")", null);
        }
        log.atInfo().addKeyValue("email.category", payload.category()).log("Email sent");
    }

    static boolean permanent(Throwable failure) {
        for (Throwable cause = failure; cause != null; cause = cause.getCause()) {
            if (cause instanceof MailAuthenticationException
                    || cause instanceof AuthenticationFailedException
                    || cause instanceof MailParseException
                    || cause instanceof MailPreparationException
                    || (cause instanceof SendFailedException sendFailed
                            && sendFailed.getInvalidAddresses() != null
                            && sendFailed.getInvalidAddresses().length > 0)) {
                return true;
            }
        }
        return false;
    }
}
