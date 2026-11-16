package com.avenra.ai.api;

import com.avenra.ai.application.AiSettingsService;
import com.avenra.contract.v1.api.AiApi;
import com.avenra.contract.v1.model.AiSettings;
import com.avenra.contract.v1.model.AiSettingsInput;
import com.avenra.contract.v1.model.AiUsage;
import com.avenra.platform.security.CurrentUser;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/** Implements the contract's AI operations (ADR-008); authorization is in the service. */
@RestController
class AiController implements AiApi {

    private final AiSettingsService settings;

    AiController(AiSettingsService settings) {
        this.settings = settings;
    }

    @Override
    public ResponseEntity<AiSettings> getAiSettings(UUID organizationId) {
        return ResponseEntity.ok(settings.get(CurrentUser.require().userId(), organizationId));
    }

    @Override
    public ResponseEntity<AiSettings> updateAiSettings(UUID organizationId, AiSettingsInput body) {
        return ResponseEntity.ok(settings.update(
                CurrentUser.require().userId(), organizationId, body.getDocumentReading(), body.getWorkPlanning()));
    }

    @Override
    public ResponseEntity<AiUsage> getAiUsage(UUID organizationId) {
        return ResponseEntity.ok(settings.usage(CurrentUser.require().userId(), organizationId));
    }
}
