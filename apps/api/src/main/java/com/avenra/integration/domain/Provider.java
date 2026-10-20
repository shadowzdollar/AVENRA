package com.avenra.integration.domain;

import java.util.List;

/** The kinds of connection and what each can do (§54). Callers ask for capabilities. */
public enum Provider {
    WEBHOOK(List.of(Capability.EVENTS_DELIVER)),
    S3_EXPORT(List.of(Capability.STORAGE_EXPORT_COMPLETION));

    private final List<Capability> capabilities;

    Provider(List<Capability> capabilities) {
        this.capabilities = capabilities;
    }

    public List<Capability> capabilities() {
        return capabilities;
    }

    public boolean can(Capability capability) {
        return capabilities.contains(capability);
    }

    public enum Capability {
        EVENTS_DELIVER("events.deliver"),
        STORAGE_EXPORT_COMPLETION("storage.export_completion");

        private final String code;

        Capability(String code) {
            this.code = code;
        }

        public String code() {
            return code;
        }
    }
}
