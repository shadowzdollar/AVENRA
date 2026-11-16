package com.avenra.platform.email;

import com.avenra.platform.AvenraProperties;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/** SMTP delivery (ADR-015): Mailpit locally, the chosen provider's SMTP endpoint in deployments. */
@Component
class SmtpEmailSender implements EmailSender {

    private final JavaMailSender mail;
    private final String from;

    SmtpEmailSender(JavaMailSender mail, AvenraProperties properties) {
        this.mail = mail;
        this.from = properties.email().from();
    }

    @Override
    public void send(EmailMessage message) {
        var mime = new SimpleMailMessage();
        mime.setFrom(from);
        mime.setTo(message.to());
        mime.setSubject(message.subject());
        mime.setText(message.body());
        mail.send(mime);
    }
}
