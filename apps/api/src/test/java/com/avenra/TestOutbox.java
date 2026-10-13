package com.avenra;

import com.avenra.platform.email.EmailMessage;
import com.avenra.platform.email.EmailSender;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/** Captures sent email in tests instead of using SMTP. */
@Component
@Primary
public class TestOutbox implements EmailSender {

    private static final Pattern TOKEN = Pattern.compile("[?&]token=([A-Za-z0-9_-]+)");

    private final List<EmailMessage> sent = new CopyOnWriteArrayList<>();

    @Override
    public void send(EmailMessage message) {
        sent.add(message);
    }

    public List<EmailMessage> to(String address) {
        return sent.stream()
                .filter(message -> message.to().equalsIgnoreCase(address))
                .toList();
    }

    /** The token from the latest email of a category sent to an address. */
    public Optional<String> latestToken(String address, String category) {
        return to(address).stream()
                .filter(message -> message.category().equals(category))
                .reduce((first, second) -> second)
                .map(message -> {
                    Matcher matcher = TOKEN.matcher(message.body());
                    return matcher.find() ? matcher.group(1) : null;
                });
    }
}
