package com.avenra.notification.api;

import com.avenra.contract.v1.api.NotificationsApi;
import com.avenra.contract.v1.model.NotificationList;
import com.avenra.contract.v1.model.NotificationPreferences;
import com.avenra.contract.v1.model.NotificationPreferencesInput;
import com.avenra.notification.application.NotificationService;
import com.avenra.platform.security.CurrentUser;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/** Implements the contract's notification operations (ADR-008). Every call acts for the caller only. */
@RestController
class NotificationsController implements NotificationsApi {

    private final NotificationService notifications;

    NotificationsController(NotificationService notifications) {
        this.notifications = notifications;
    }

    @Override
    public ResponseEntity<NotificationList> listNotifications() {
        return ResponseEntity.ok(notifications.list(userId()));
    }

    @Override
    public ResponseEntity<Void> readNotification(UUID notificationId) {
        notifications.read(userId(), notificationId);
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Void> readAllNotifications() {
        notifications.readAll(userId());
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<NotificationPreferences> getNotificationPreferences() {
        return ResponseEntity.ok(notifications.preferences(userId()));
    }

    @Override
    public ResponseEntity<NotificationPreferences> updateNotificationPreferences(NotificationPreferencesInput body) {
        return ResponseEntity.ok(notifications.update(userId(), body));
    }

    private static UUID userId() {
        return CurrentUser.require().userId();
    }
}
