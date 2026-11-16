/**
 * Notification module: tells the right people what needs them, in the app and by email, once, as
 * they chose (Guidelines §56, ADR-035). It listens to other modules' facts; nothing depends on it.
 */
@ApplicationModule(displayName = "Notification")
package com.avenra.notification;

import org.springframework.modulith.ApplicationModule;
