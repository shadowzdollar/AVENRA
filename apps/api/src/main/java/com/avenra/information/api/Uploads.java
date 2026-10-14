package com.avenra.information.api;

import com.avenra.platform.web.ApiException;
import java.io.IOException;
import java.io.InputStream;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

/** Opens an uploaded part; a part that cannot be read is the client's problem, not ours. */
final class Uploads {

    private Uploads() {}

    static InputStream open(MultipartFile file) {
        try {
            return file.getInputStream();
        } catch (IOException unreadable) {
            throw new ApiException("MALFORMED_REQUEST", HttpStatus.BAD_REQUEST, "The request could not be read.");
        }
    }
}
