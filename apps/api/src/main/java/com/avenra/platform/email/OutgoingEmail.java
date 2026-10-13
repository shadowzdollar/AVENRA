package com.avenra.platform.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Sends email only after the surrounding database transaction commits (ADR-015), so no email goes
 * out for a change that rolled back. Delivery is retried a few times; if it still fails the error
 * is logged and the user can ask for the email again. Phase 4 moves this to the durable job queue.
 */
@Component
public class OutgoingEmail {

    private static final Logger log = LoggerFactory.getLogger(OutgoingEmail.class);
    private static final int ATTEMPTS = 3;

    private final EmailSender sender;

    OutgoingEmail(EmailSender sender) {
        this.sender = sender;
    }

    public void sendAfterCommit(EmailMessage message) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            throw new IllegalStateException("sendAfterCommit must be called inside a transaction");
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                deliver(message);
            }
        });
    }

    private void deliver(EmailMessage message) {
        for (int attempt = 1; attempt <= ATTEMPTS; attempt++) {
            try {
                sender.send(message);
                log.atInfo().addKeyValue("email.category", message.category()).log("Email sent");
                return;
            } catch (RuntimeException exception) {
                log.atWarn()
                        .addKeyValue("email.category", message.category())
                        .addKeyValue("attempt", attempt)
                        .setCause(exception)
                        .log("Email delivery failed");
            }
        }
        log.atError().addKeyValue("email.category", message.category()).log("Email not delivered after retries");
    }
}
