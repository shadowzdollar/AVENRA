package com.avenra.billing.domain;

/** Supported payment rails across self-service and enterprise contracts. */
public enum PaymentMethodType {
    CARD,
    MOBILE_MONEY,
    DIGITAL_WALLET,
    BANK_TRANSFER
}
