package com.avenra.information.api;

import com.avenra.contract.v1.api.ClientRequestsApi;
import com.avenra.contract.v1.model.ClientRequest;
import com.avenra.contract.v1.model.ClientRequestItem;
import com.avenra.contract.v1.model.ValueSubmission;
import com.avenra.information.application.ClientRequestService;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Implements the public client-request operations (ADR-020). The request token is the only
 * credential; it arrives in a header and is never logged.
 */
@RestController
class ClientRequestsController implements ClientRequestsApi {

    private final ClientRequestService requests;

    ClientRequestsController(ClientRequestService requests) {
        this.requests = requests;
    }

    @Override
    public ResponseEntity<ClientRequest> getClientRequest(String token) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(requests.open(token));
    }

    @Override
    public ResponseEntity<ClientRequestItem> submitClientValue(String token, UUID requirementId, ValueSubmission body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(requests.submitValue(token, requirementId, body.getValue()));
    }

    @Override
    public ResponseEntity<ClientRequestItem> uploadClientFile(String token, UUID requirementId, MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(requests.uploadFile(token, requirementId, Uploads.open(file), file.getOriginalFilename()));
    }
}
