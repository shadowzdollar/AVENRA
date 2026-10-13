package com.avenra.organization.domain;

/**
 * Capabilities checked by the application (Guidelines §18). Business code asks for a permission,
 * never for a role. The codes match {@code x-avenra-permission} in the contract.
 */
public enum Permission {
    ORGANIZATION_READ("organization.read"),
    ORGANIZATION_MANAGE("organization.manage"),
    MEMBERS_READ("members.read"),
    MEMBERS_MANAGE("members.manage"),
    WORK_READ("work.read"),
    WORK_CREATE("work.create"),
    WORK_UPDATE("work.update"),
    WORK_EXECUTE("work.execute"),
    WORK_APPROVE("work.approve"),
    WORK_DELETE("work.delete"),
    INFORMATION_READ("information.read"),
    INFORMATION_COLLECT("information.collect"),
    INFORMATION_VERIFY("information.verify"),
    INTEGRATION_READ("integration.read"),
    INTEGRATION_MANAGE("integration.manage"),
    BILLING_READ("billing.read"),
    BILLING_MANAGE("billing.manage"),
    AUDIT_READ("audit.read");

    private final String code;

    Permission(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }
}
