/**
 * Billing module: plans, subscriptions, entitlements and usage records (Guidelines §110–§111,
 * ADR-037). Business modules only ask {@code Entitlements}; prices live at the billing provider.
 */
@ApplicationModule(displayName = "Billing")
package com.avenra.billing;

import org.springframework.modulith.ApplicationModule;
