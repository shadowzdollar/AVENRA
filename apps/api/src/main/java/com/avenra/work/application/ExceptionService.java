package com.avenra.work.application;

import com.avenra.audit.AuditLog;
import com.avenra.contract.v1.model.AssignExceptionRequest;
import com.avenra.contract.v1.model.ExceptionTransitionRequest;
import com.avenra.contract.v1.model.WorkException;
import com.avenra.contract.v1.model.WorkExceptionSource;
import com.avenra.organization.OrganizationAccess;
import com.avenra.organization.domain.Permission;
import com.avenra.platform.web.ApiException;
import com.avenra.platform.web.Text;
import com.avenra.work.domain.ExceptionStatus;
import com.avenra.work.infrastructure.ExceptionRepository;
import com.avenra.work.infrastructure.ExceptionRepository.ExceptionRow;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

/** People handling exceptions (ADR-024): list, assign, and move them along their lifecycle. */
@Service
public class ExceptionService {

    private final ExceptionRepository repository;
    private final OrganizationAccess access;
    private final AuditLog audit;
    private final Clock clock;

    ExceptionService(ExceptionRepository repository, OrganizationAccess access, AuditLog audit, Clock clock) {
        this.repository = repository;
        this.access = access;
        this.audit = audit;
        this.clock = clock;
    }

    public List<WorkException> list(UUID userId, UUID organizationId, ExceptionRepository.Filter filter) {
        return access.run(
                userId,
                organizationId,
                Permission.WORK_READ,
                granted -> repository.list(organizationId, filter).stream()
                        .map(ExceptionService::toApi)
                        .toList());
    }

    public WorkException get(UUID userId, UUID organizationId, UUID exceptionId) {
        return access.run(
                userId,
                organizationId,
                Permission.WORK_READ,
                granted -> toApi(repository.find(organizationId, exceptionId).orElseThrow(ApiException::notFound)));
    }

    public WorkException assign(UUID userId, UUID organizationId, UUID exceptionId, AssignExceptionRequest input) {
        UUID member = input.getAssigneeMembershipId();
        return access.run(userId, organizationId, Permission.WORK_UPDATE, granted -> {
            var current = repository.findForUpdate(organizationId, exceptionId).orElseThrow(ApiException::notFound);
            if (current.status().isFinal()) {
                throw ApiException.conflict("EXCEPTION_CLOSED", "This exception is closed.");
            }
            if (member != null && !access.isMembership(organizationId, member)) {
                throw ApiException.invalid("assigneeMembershipId", "is not a member of this organization");
            }
            repository.assign(exceptionId, member, OffsetDateTime.now(clock));
            audit.record(AuditLog.Event.of("work.exception.assigned", organizationId, userId)
                    .resource("exception", exceptionId));
            return toApi(repository.find(organizationId, exceptionId).orElseThrow());
        });
    }

    public WorkException transition(
            UUID userId, UUID organizationId, UUID exceptionId, ExceptionTransitionRequest input) {
        ExceptionStatus target = ExceptionStatus.valueOf(input.getTo().getValue());
        ExceptionStatus expected =
                ExceptionStatus.valueOf(input.getExpectedStatus().getValue());
        String resolution = Text.optional(input.getResolution());
        return access.run(userId, organizationId, Permission.WORK_UPDATE, granted -> {
            var current = repository.findForUpdate(organizationId, exceptionId).orElseThrow(ApiException::notFound);
            if (current.status() == target) {
                return toApi(current);
            }
            if (current.status() != expected) {
                throw ApiException.conflict(
                        "STATUS_CHANGED", "The exception changed status meanwhile. Reload it and try again.");
            }
            if (!current.status().canMoveTo(target)) {
                throw ApiException.conflict(
                        "INVALID_TRANSITION",
                        "An exception cannot move from " + current.status() + " to " + target + ".");
            }
            if (target.needsResolution() && resolution == null) {
                throw ApiException.invalid("resolution", "is required to close an exception");
            }
            repository.changeStatus(
                    exceptionId, target, resolution, target.isFinal() ? userId : null, OffsetDateTime.now(clock));
            audit.record(AuditLog.Event.of("work.exception.transitioned", organizationId, userId)
                    .resource("exception", exceptionId)
                    .detail("from", current.status().name())
                    .detail("to", target.name()));
            return toApi(repository.find(organizationId, exceptionId).orElseThrow());
        });
    }

    static WorkException toApi(ExceptionRow row) {
        return new WorkException(
                        row.id(),
                        WorkException.TypeEnum.fromValue(row.type().name()),
                        WorkException.SeverityEnum.fromValue(row.severity().name()),
                        row.description(),
                        new WorkExceptionSource(row.sourceType(), row.sourceId()),
                        com.avenra.contract.v1.model.ExceptionStatus.fromValue(
                                row.status().name()),
                        WorkViews.utc(row.createdAt()),
                        row.status().next().stream()
                                .sorted(Comparator.naturalOrder())
                                .map(status -> com.avenra.contract.v1.model.ExceptionStatus.fromValue(status.name()))
                                .toList())
                .workId(row.workId())
                .assigneeMembershipId(row.assigneeMembershipId())
                .resolution(row.resolution())
                .updatedAt(WorkViews.utc(row.updatedAt()))
                .resolvedAt(WorkViews.utcOrNull(row.resolvedAt()))
                .resolvedByUserId(row.resolvedBy());
    }
}
