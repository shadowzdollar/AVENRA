package com.avenra.work.application;

import com.avenra.agent.AgentEvents;
import com.avenra.agent.WorkTools;
import com.avenra.contract.v1.model.CreateTaskRequest;
import com.avenra.work.domain.ExceptionType;
import com.avenra.work.infrastructure.ClientRepository;
import com.avenra.work.infrastructure.WorkRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * The work module's side of the agent's tool gateway (ADR-033): facts for planning, and actions
 * that go through {@link WorkService}, so a step can never do more than its person could.
 */
@Component
class AgentWorkTools implements WorkTools {

    private final WorkRepository work;
    private final ClientRepository clients;
    private final WorkService service;
    private final Exceptions exceptions;

    AgentWorkTools(WorkRepository work, ClientRepository clients, WorkService service, Exceptions exceptions) {
        this.work = work;
        this.clients = clients;
        this.service = service;
        this.exceptions = exceptions;
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public Optional<WorkFacts> facts(UUID organizationId, UUID workId) {
        return work.find(organizationId, workId)
                .map(row -> new WorkFacts(
                        row.title(),
                        row.description(),
                        row.type(),
                        row.clientId() == null
                                ? null
                                : clients.findClient(organizationId, row.clientId())
                                        .map(ClientRepository.ClientRow::email)
                                        .orElse(null),
                        !row.status().isFinal()));
    }

    @Override
    public UUID createTask(
            UUID userId, UUID organizationId, UUID workId, String idempotencyKey, String title, String condition) {
        return service.createTask(
                        userId, organizationId, workId, idempotencyKey, new CreateTaskRequest(title, condition))
                .getId();
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public boolean taskExists(UUID organizationId, UUID workId, UUID taskId, String title) {
        return work.tasks(organizationId, workId).stream()
                .anyMatch(task -> task.id().equals(taskId) && task.title().equals(title));
    }

    /** A stopped or failed run asks for a person (§131): a human-required exception on the work. */
    @EventListener
    void on(AgentEvents.RunNeedsAttention event) {
        exceptions.raise(
                event.organizationId(),
                event.workId(),
                ExceptionType.HUMAN_REQUIRED,
                "The assistant's run " + event.status().toLowerCase(java.util.Locale.ROOT) + ": " + event.reason()
                        + " Look at the run on the work and decide what to do next.",
                "agent_run",
                event.runId().toString());
    }
}
