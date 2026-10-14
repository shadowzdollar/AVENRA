package com.avenra.document.application;

import java.io.InputStream;
import java.nio.file.Path;

/** The private object store holding file contents (ADR-019). Keys are always tenant-prefixed. */
public interface DocumentStorage {

    void put(String key, Path file, String contentType, byte[] sha256);

    InputStream get(String key);

    final class StorageUnavailableException extends RuntimeException {

        private static final long serialVersionUID = 1L;

        public StorageUnavailableException(Throwable cause) {
            super("Document storage unavailable", cause, false, false);
        }
    }
}
