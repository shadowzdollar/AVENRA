package com.avenra.platform.web;

import com.avenra.contract.v1.api.PlatformApi;
import com.avenra.contract.v1.model.ApiMeta;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/** Implements the contract's platform operations (ADR-008). */
@RestController
class ApiMetaController implements PlatformApi {

    @Override
    public ResponseEntity<ApiMeta> getApiMeta() {
        // Generated DTOs are mutable, so a new instance is returned on every call.
        return ResponseEntity.ok(new ApiMeta("avenra-api", "v1"));
    }
}
