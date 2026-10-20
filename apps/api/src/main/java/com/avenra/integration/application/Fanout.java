package com.avenra.integration.application;

import com.avenra.information.InformationEvents;
import com.avenra.integration.domain.EventType;
import com.avenra.work.WorkEvents;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Turns domain facts into integration events (§57): separate types, versioned, with identifiers
 * and titles only. Fan-out to connections happens in a job in the organization's scope, because a
 * fact can be recorded in a client's request-link scope.
 */
@Component
class Fanout {

    private final Deliveries deliveries;
    private final Clock clock;

    Fanout(Deliveries deliveries, Clock clock) {
        this.deliveries = deliveries;
        this.clock = clock;
    }

    @EventListener
    void on(WorkEvents.Completed completed) {
        var data = new LinkedHashMap<String, Object>();
        data.put("workId", completed.workId().toString());
        data.put("title", completed.title());
        data.put("completedAt", completed.completedAt().toString());
        data.put("manifestSha256", completed.manifestSha256());
        deliveries.publish(IntegrationEvent.of(
                EventType.WORK_COMPLETED, completed.organizationId(), completed.completedAt(), data));
    }

    @EventListener
    void on(InformationEvents.AnswerReceived received) {
        deliveries.publish(IntegrationEvent.of(
                EventType.ANSWER_RECEIVED,
                received.organizationId(),
                OffsetDateTime.now(clock),
                Map.of(
                        "workId", received.workId().toString(),
                        "requirementId", received.requirementId().toString(),
                        "requirementTitle", received.requirementTitle(),
                        "itemId", received.itemId().toString(),
                        "fromClient", received.fromClient())));
    }

    @EventListener
    void on(InformationEvents.RequestExpiredIncomplete expired) {
        // The recipient's address is personal data and stays inside Avenra.
        deliveries.publish(IntegrationEvent.of(
                EventType.REQUEST_EXPIRED,
                expired.organizationId(),
                OffsetDateTime.now(clock),
                Map.of(
                        "workId", expired.workId().toString(),
                        "requestLinkId", expired.requestLinkId().toString(),
                        "missingItems", expired.missing())));
    }
}
