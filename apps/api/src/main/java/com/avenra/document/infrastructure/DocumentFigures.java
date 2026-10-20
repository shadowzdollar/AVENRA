package com.avenra.document.infrastructure;

import com.avenra.platform.administration.HealthContributor;
import com.avenra.platform.administration.UsageContributor;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/** Stored documents, for administrators (ADR-036). */
@Component
@Order(40)
class DocumentFigures implements UsageContributor, HealthContributor {

    private final JdbcClient jdbc;

    DocumentFigures(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Figure> usage(UUID organizationId) {
        return jdbc.sql("""
                        select count(distinct document_id) as documents, coalesce(sum(size_bytes), 0) as bytes
                        from document_versions where organization_id = :org
                        """)
                .param("org", organizationId)
                .query((rs, row) -> List.of(
                        new Figure("documents", "Documents", rs.getLong("documents")),
                        new Figure("documents.bytes", "Stored file size (bytes)", rs.getLong("bytes"))))
                .single();
    }

    @Override
    public List<Check> health(UUID organizationId, OffsetDateTime since) {
        long quarantined = jdbc.sql("""
                        select count(*) from document_versions
                        where organization_id = :org and scan_status = 'INFECTED'
                          and coalesce(last_scanned_at, uploaded_at) >= :since
                        """)
                .param("org", organizationId)
                .param("since", since)
                .query(Long.class)
                .single();
        return List.of(
                new Check("documents.quarantined", "Files quarantined as malware", quarantined, quarantined > 0));
    }
}
