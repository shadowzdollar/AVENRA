package com.avenra.analytics.api;

import com.avenra.analytics.application.AnalyticsService;
import com.avenra.contract.v1.api.AnalyticsApi;
import com.avenra.contract.v1.model.AnalyticsReport;
import com.avenra.platform.security.CurrentUser;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/** Implements the contract's analytics operations (ADR-038). */
@RestController
class AnalyticsController implements AnalyticsApi {

    private final AnalyticsService analytics;

    AnalyticsController(AnalyticsService analytics) {
        this.analytics = analytics;
    }

    @Override
    public ResponseEntity<AnalyticsReport> getAnalytics(UUID organizationId, Integer days) {
        return ResponseEntity.ok(analytics.report(CurrentUser.require().userId(), organizationId, days));
    }
}
