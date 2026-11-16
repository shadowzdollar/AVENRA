package com.avenra;

import com.avenra.platform.email.EmailMessage;
import com.avenra.platform.email.EmailSender;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Predicate;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * Captures sent email in tests instead of using SMTP. Email is delivered by background jobs
 * (ADR-025), so lookups wait briefly for the message to arrive. Failures can be injected to test
 * retries.
 */
@Component
@Primary
public class TestOutbox implements EmailSender {

    private static final Pattern TOKEN = Pattern.compile("[?&]token=([A-Za-z0-9_-]+)");
    private static final Duration WAIT = Duration.ofSeconds(10);

    private final List<EmailMessage> sent = new CopyOnWriteArrayList<>();
    private final Deque<RuntimeException> failures = new ArrayDeque<>();

    @Override
    public void send(EmailMessage message) {
        synchronized (failures) {
            if (!failures.isEmpty()) {
                throw failures.poll();
            }
        }
        sent.add(message);
    }

    /** The next sends fail with these exceptions, in order. */
    public void failNext(RuntimeException... next) {
        synchronized (failures) {
            failures.addAll(List.of(next));
        }
    }

    public void clearFailures() {
        synchronized (failures) {
            failures.clear();
        }
    }

    /** Messages to an address, waiting until at least one has arrived (or the wait ends). */
    public List<EmailMessage> to(String address) {
        return await(message -> message.to().equalsIgnoreCase(address));
    }

    /** Messages matching the condition, waiting until at least one has arrived (or the wait ends). */
    public List<EmailMessage> await(Predicate<EmailMessage> condition) {
        long deadline = System.nanoTime() + WAIT.toNanos();
        while (true) {
            var matching = sent.stream().filter(condition).toList();
            if (!matching.isEmpty() || System.nanoTime() > deadline) {
                return matching;
            }
            pause();
        }
    }

    /** Messages matching the condition right now, without waiting. */
    public List<EmailMessage> now(Predicate<EmailMessage> condition) {
        return sent.stream().filter(condition).toList();
    }

    /** The token from the latest email of a category sent to an address. */
    public Optional<String> latestToken(String address, String category) {
        return await(message -> message.to().equalsIgnoreCase(address)
                        && message.category().equals(category))
                .stream()
                .reduce((first, second) -> second)
                .map(message -> {
                    Matcher matcher = TOKEN.matcher(message.body());
                    return matcher.find() ? matcher.group(1) : null;
                });
    }

    private static void pause() {
        try {
            Thread.sleep(50);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(interrupted);
        }
    }
}
