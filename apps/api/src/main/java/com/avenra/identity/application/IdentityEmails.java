package com.avenra.identity.application;

import com.avenra.platform.AvenraProperties;
import com.avenra.platform.email.EmailMessage;
import java.net.URI;
import java.time.Duration;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

/** Texts of the identity emails. Links carry single-use tokens and point at the web app. */
@Component
class IdentityEmails {

    private final URI base;

    IdentityEmails(AvenraProperties properties) {
        this.base = properties.web().publicBaseUrl();
    }

    EmailMessage verification(String to, String name, String token, Duration validity) {
        return new EmailMessage(
                to,
                "Confirm your email address for Avenra",
                "Hello " + name + ",\n\nConfirm your email address to finish setting up your Avenra account:\n\n"
                        + link("/verify-email", token) + "\n\nThe link works once and expires in " + hours(validity)
                        + ". If you did not sign up, ignore this email.\n",
                "email-verification");
    }

    EmailMessage alreadyRegistered(String to, String name) {
        return new EmailMessage(
                to,
                "You already have an Avenra account",
                "Hello " + name + ",\n\nSomeone tried to create an Avenra account with this email address, which "
                        + "already has one. You can sign in at " + base.resolve("/sign-in")
                        + "\n\nIf you forgot your password, reset it from the sign-in page. If this was not you, "
                        + "ignore this email.\n",
                "already-registered");
    }

    EmailMessage passwordReset(String to, String name, String token, Duration validity) {
        return new EmailMessage(
                to,
                "Reset your Avenra password",
                "Hello " + name + ",\n\nUse this link to choose a new password:\n\n" + link("/reset-password", token)
                        + "\n\nThe link works once and expires in " + minutes(validity)
                        + ". All your sessions will be signed out. If you did not ask for this, ignore this email.\n",
                "password-reset");
    }

    EmailMessage passwordChanged(String to, String name) {
        return new EmailMessage(
                to,
                "Your Avenra password was changed",
                "Hello " + name + ",\n\nThe password of your Avenra account was just changed and other sessions "
                        + "were signed out. If this was not you, reset your password immediately.\n",
                "password-changed");
    }

    private String link(String path, String token) {
        return UriComponentsBuilder.fromUri(base)
                .path(path)
                .queryParam("token", token)
                .build()
                .toUriString();
    }

    private static String hours(Duration duration) {
        long hours = duration.toHours();
        return hours == 1 ? "1 hour" : hours + " hours";
    }

    private static String minutes(Duration duration) {
        return duration.toMinutes() + " minutes";
    }
}
