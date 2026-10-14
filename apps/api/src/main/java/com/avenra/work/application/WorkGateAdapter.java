package com.avenra.work.application;

import com.avenra.information.WorkGate;
import com.avenra.platform.web.ApiException;
import com.avenra.work.infrastructure.WorkRepository;
import com.avenra.work.infrastructure.WorkRepository.WorkRow;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** The work module's side of {@link WorkGate} (ADR-026). */
@Component
class WorkGateAdapter implements WorkGate {

    private final WorkRepository work;
    private final Clock clock;

    WorkGateAdapter(WorkRepository work, Clock clock) {
        this.work = work;
        this.clock = clock;
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public WorkInfo lockOpen(UUID organizationId, UUID workId) {
        WorkRow row = work.findForUpdate(organizationId, workId).orElseThrow(ApiException::notFound);
        if (row.status().isFinal()) {
            throw WorkService.closed();
        }
        return info(row);
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public Optional<WorkInfo> find(UUID organizationId, UUID workId) {
        return work.find(organizationId, workId).map(WorkGateAdapter::info);
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void touch(UUID organizationId, UUID workId) {
        work.touch(organizationId, workId, OffsetDateTime.now(clock));
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public Optional<WorkInfo> findForRequestLink(UUID workId) {
        return work.findForRequestLink(workId).map(WorkGateAdapter::info);
    }

    private static WorkInfo info(WorkRow row) {
        return new WorkInfo(
                row.id(), row.organizationId(), row.title(), row.status().isFinal(), row.ownerMembershipId());
    }
}
