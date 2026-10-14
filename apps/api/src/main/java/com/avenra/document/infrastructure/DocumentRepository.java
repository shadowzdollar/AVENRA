package com.avenra.document.infrastructure;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Documents and their immutable versions (ADR-019). Versions are only ever inserted. */
@Repository
public class DocumentRepository {

    public record VersionRow(
            UUID documentId,
            int version,
            UUID organizationId,
            String fileName,
            String contentType,
            long sizeBytes,
            byte[] sha256,
            String storageKey,
            String scanStatus,
            @Nullable String scanSignature,
            @Nullable UUID uploadedByUserId,
            @Nullable UUID uploadedViaLinkId,
            OffsetDateTime uploadedAt) {}

    private static final String COLUMNS = "document_id, version, organization_id, file_name, content_type, size_bytes,"
            + " sha256, storage_key, scan_status, scan_signature, uploaded_by_user_id, uploaded_via_link_id, uploaded_at";

    private final JdbcClient jdbc;

    DocumentRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /** The document of a requirement, created on first use. */
    public UUID documentForRequirement(UUID organizationId, UUID requirementId, OffsetDateTime now) {
        jdbc.sql("""
                        insert into documents (id, organization_id, requirement_id, created_at)
                        values (:id, :org, :requirement, :now)
                        on conflict (requirement_id) do nothing
                        """)
                .param("id", UUID.randomUUID())
                .param("org", organizationId)
                .param("requirement", requirementId)
                .param("now", now)
                .update();
        return jdbc.sql("select id from documents where organization_id = :org and requirement_id = :requirement")
                .param("org", organizationId)
                .param("requirement", requirementId)
                .query(UUID.class)
                .single();
    }

    public int nextVersion(UUID documentId) {
        return jdbc.sql("select coalesce(max(version), 0) + 1 from document_versions where document_id = :id")
                .param("id", documentId)
                .query(Integer.class)
                .single();
    }

    public void insertVersion(VersionRow row) {
        jdbc.sql("insert into document_versions (" + COLUMNS + ", last_scanned_at) values (:document, :version, :org,"
                        + " :name, :type, :size, :sha, :key, :scan, :signature, :user, :link, :at, :at)")
                .param("document", row.documentId())
                .param("version", row.version())
                .param("org", row.organizationId())
                .param("name", row.fileName())
                .param("type", row.contentType())
                .param("size", row.sizeBytes())
                .param("sha", row.sha256())
                .param("key", row.storageKey())
                .param("scan", row.scanStatus())
                .param("signature", row.scanSignature())
                .param("user", row.uploadedByUserId())
                .param("link", row.uploadedViaLinkId())
                .param("at", row.uploadedAt())
                .update();
    }

    public Optional<VersionRow> findVersion(UUID organizationId, UUID documentId, int version) {
        return jdbc.sql("select " + COLUMNS + " from document_versions"
                        + " where organization_id = :org and document_id = :document and version = :version")
                .param("org", organizationId)
                .param("document", documentId)
                .param("version", version)
                .query(VersionRow.class)
                .optional();
    }

    /** The version locked for rescanning, with the requirement its document belongs to. */
    public Optional<VersionRow> findVersionForUpdate(UUID organizationId, UUID documentId, int version) {
        return jdbc.sql("select " + COLUMNS + " from document_versions"
                        + " where organization_id = :org and document_id = :document and version = :version for update")
                .param("org", organizationId)
                .param("document", documentId)
                .param("version", version)
                .query(VersionRow.class)
                .optional();
    }

    public Optional<UUID> requirementOf(UUID documentId) {
        return jdbc.sql("select requirement_id from documents where id = :id")
                .param("id", documentId)
                .query(UUID.class)
                .optional();
    }

    public void markScanned(UUID documentId, int version, OffsetDateTime now) {
        jdbc.sql("update document_versions set last_scanned_at = :now where document_id = :document and version = :v")
                .param("document", documentId)
                .param("v", version)
                .param("now", now)
                .update();
    }

    public void quarantine(UUID documentId, int version, String key, String signature, OffsetDateTime now) {
        jdbc.sql("""
                        update document_versions
                        set scan_status = 'INFECTED', scan_signature = :signature, storage_key = :key, last_scanned_at = :now
                        where document_id = :document and version = :v
                        """)
                .param("document", documentId)
                .param("v", version)
                .param("key", key)
                .param("signature", signature)
                .param("now", now)
                .update();
    }

    public List<VersionRow> findVersions(Collection<UUID> documentIds) {
        if (documentIds.isEmpty()) {
            return List.of();
        }
        return jdbc.sql("select " + COLUMNS + " from document_versions where document_id in (:ids)")
                .param("ids", documentIds)
                .query(VersionRow.class)
                .list();
    }
}
