package com.avenra.agent.api;

import com.avenra.agent.application.AgentService;
import com.avenra.contract.v1.api.AgentsApi;
import com.avenra.contract.v1.model.AgentApprovalRequest;
import com.avenra.contract.v1.model.AgentRun;
import com.avenra.contract.v1.model.AgentStopRequest;
import com.avenra.platform.security.CurrentUser;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/** Implements the contract's agent operations (ADR-008); authorization is in the service. */
@RestController
class AgentController implements AgentsApi {

    private final AgentService agents;

    AgentController(AgentService agents) {
        this.agents = agents;
    }

    @Override
    public ResponseEntity<List<AgentRun>> listAgentRuns(UUID organizationId, UUID workId) {
        return ResponseEntity.ok(agents.list(userId(), organizationId, workId));
    }

    @Override
    public ResponseEntity<AgentRun> startAgentRun(UUID organizationId, UUID workId, String idempotencyKey) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(agents.start(userId(), organizationId, workId, idempotencyKey));
    }

    @Override
    public ResponseEntity<AgentRun> getAgentRun(UUID organizationId, UUID workId, UUID runId) {
        return ResponseEntity.ok(agents.get(userId(), organizationId, workId, runId));
    }

    @Override
    public ResponseEntity<AgentRun> decideAgentRun(
            UUID organizationId, UUID workId, UUID runId, AgentApprovalRequest body) {
        return ResponseEntity.ok(agents.decide(userId(), organizationId, workId, runId, body));
    }

    @Override
    public ResponseEntity<AgentRun> stopAgentRun(UUID organizationId, UUID workId, UUID runId, AgentStopRequest body) {
        return ResponseEntity.ok(agents.stop(userId(), organizationId, workId, runId, body.getReason()));
    }

    private static UUID userId() {
        return CurrentUser.require().userId();
    }
}
