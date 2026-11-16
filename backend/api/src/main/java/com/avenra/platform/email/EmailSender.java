package com.avenra.platform.email;

/** Delivers one email now. Implementations: SMTP in the application, an in-memory outbox in tests. */
public interface EmailSender {

    void send(EmailMessage message);
}
