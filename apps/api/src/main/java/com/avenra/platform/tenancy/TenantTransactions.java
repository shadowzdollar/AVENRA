package com.avenra.platform.tenancy;

import java.util.UUID;
import java.util.function.Supplier;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Runs work in a database transaction whose row-level security context is set (ADR-005). The
 * settings are transaction-scoped ({@code set_config(..., true)}), so they cannot leak to the next
 * user of a pooled connection.
 */
@Component
public class TenantTransactions {

    private final TransactionTemplate transactions;
    private final JdbcClient jdbc;

    TenantTransactions(TransactionTemplate transactions, JdbcClient jdbc) {
        this.transactions = transactions;
        this.jdbc = jdbc;
    }

    public <T> T run(TenantScope scope, Supplier<T> work) {
        return transactions.execute(status -> {
            set("app.user_id", scope.userId());
            set("app.organization_id", scope.organizationId());
            set("app.invitation_token_hash", scope.invitationTokenHashHex());
            set("app.request_link_token_hash", scope.requestLinkTokenHashHex());
            return work.get();
        });
    }

    public void runWithoutResult(TenantScope scope, Runnable work) {
        run(scope, () -> {
            work.run();
            return null;
        });
    }

    /**
     * Narrows the current transaction to an organization. Only call after verifying the caller's
     * membership in it (organization module's access check); must run inside {@link #run}.
     */
    public void enterOrganization(UUID organizationId) {
        set("app.organization_id", organizationId);
    }

    private void set(String name, @Nullable Object value) {
        jdbc.sql("select set_config(:name, :value, true)")
                .param("name", name)
                .param("value", value == null ? "" : value instanceof UUID uuid ? uuid.toString() : value.toString())
                .query(String.class)
                .single();
    }
}
