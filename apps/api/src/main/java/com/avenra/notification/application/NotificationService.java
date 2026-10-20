package com.avenra.notification.application;

import com.avenra.audit.AuditLog;
import com.avenra.contract.v1.model.Notification;
import com.avenra.contract.v1.model.NotificationCategory;
import com.avenra.contract.v1.model.NotificationList;
import com.avenra.contract.v1.model.NotificationPreference;
import com.avenra.contract.v1.model.NotificationPreferences;
import com.avenra.contract.v1.model.NotificationPreferencesInput;
import com.avenra.notification.domain.Category;
import com.avenra.notification.infrastructure.NotificationRepository;
import com.avenra.platform.tenancy.TenantScope;
import com.avenra.platform.tenancy.TenantTransactions;
import com.avenra.platform.web.ApiException;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * A person's own notifications and preferences, across their organizations (ADR-035). Every
 * transaction acts for the person only, so row-level security shows nothing of anyone else's.
 */
@Service
public class NotificationService {

    private static final int LATEST = 50;

    private final NotificationRepository repository;
    private final TenantTransactions transactions;
    private final AuditLog audit;
    private final Clock clock;

    NotificationService(
            NotificationRepository repository, TenantTransactions transactions, AuditLog audit, Clock clock) {
        this.repository = repository;
        this.transactions = transactions;
        this.audit = audit;
        this.clock = clock;
    }

    public NotificationList list(UUID userId) {
        return transactions.run(
                TenantScope.user(userId),
                () -> new NotificationList(
                        repository.unread(userId),
                        repository.forUser(userId, LATEST).stream()
                                .map(row -> new Notification(
                                                row.id(),
                                                row.organizationId(),
                                                NotificationCategory.fromValue(row.category()),
                                                row.title(),
                                                row.body(),
                                                row.createdAt().withOffsetSameInstant(ZoneOffset.UTC))
                                        .link(row.link())
                                        .readAt(
                                                row.readAt() == null
                                                        ? null
                                                        : row.readAt().withOffsetSameInstant(ZoneOffset.UTC)))
                                .toList()));
    }

    public void read(UUID userId, UUID notificationId) {
        transactions.runWithoutResult(TenantScope.user(userId), () -> {
            if (!repository.markRead(userId, notificationId, OffsetDateTime.now(clock))) {
                throw ApiException.notFound();
            }
        });
    }

    public void readAll(UUID userId) {
        transactions.runWithoutResult(
                TenantScope.user(userId), () -> repository.markAllRead(userId, OffsetDateTime.now(clock)));
    }

    public NotificationPreferences preferences(UUID userId) {
        return transactions.run(TenantScope.user(userId), () -> view(userId));
    }

    public NotificationPreferences update(UUID userId, NotificationPreferencesInput input) {
        return transactions.run(TenantScope.user(userId), () -> {
            OffsetDateTime now = OffsetDateTime.now(clock);
            for (var preference : input.getPreferences()) {
                repository.savePreference(userId, preference.getCategory().getValue(), preference.getEmail(), now);
            }
            audit.record(AuditLog.Event.of("notification.preferences_changed", null, userId));
            return view(userId);
        });
    }

    private NotificationPreferences view(UUID userId) {
        var chosen = repository.preferences(userId);
        return new NotificationPreferences(Arrays.stream(Category.values())
                .map(category -> new NotificationPreference(
                        NotificationCategory.fromValue(category.code()),
                        chosen.getOrDefault(category.code(), category.emailByDefault()),
                        true))
                .toList());
    }
}
