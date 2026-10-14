package com.avenra.document.infrastructure;

import com.avenra.document.application.DocumentProperties;
import com.avenra.document.application.DocumentStorage;
import java.io.InputStream;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Base64;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.ServerSideEncryption;

/**
 * {@link DocumentStorage} on S3 or an S3-compatible service (ADR-019). The only class that knows the
 * SDK. Objects are written with a SHA-256 checksum the service verifies on receipt.
 */
@Component
class S3DocumentStorage implements DocumentStorage, DisposableBean {

    private final S3Client s3;
    private final String bucket;
    private final boolean serverSideEncryption;

    S3DocumentStorage(DocumentProperties properties) {
        var storage = properties.storage();
        var builder = S3Client.builder()
                .region(Region.of(storage.region()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(storage.accessKey(), storage.secretKey())))
                .httpClientBuilder(UrlConnectionHttpClient.builder()
                        .connectionTimeout(Duration.ofSeconds(5))
                        .socketTimeout(Duration.ofSeconds(60)))
                .forcePathStyle(storage.pathStyle());
        boolean custom =
                storage.endpoint() != null && !storage.endpoint().toString().isBlank();
        if (custom) {
            builder.endpointOverride(storage.endpoint());
        }
        this.s3 = builder.build();
        this.bucket = storage.bucket();
        // AWS encrypts at rest when asked; S3-compatible services configure it themselves.
        this.serverSideEncryption = !custom;
    }

    @Override
    public void put(String key, Path file, String contentType, byte[] sha256) {
        var request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .checksumSHA256(Base64.getEncoder().encodeToString(sha256));
        if (serverSideEncryption) {
            request.serverSideEncryption(ServerSideEncryption.AES256);
        }
        try {
            s3.putObject(request.build(), RequestBody.fromFile(file));
        } catch (SdkException failure) {
            throw new StorageUnavailableException(failure);
        }
    }

    @Override
    public InputStream get(String key) {
        try {
            return s3.getObject(
                    GetObjectRequest.builder().bucket(bucket).key(key).build());
        } catch (SdkException failure) {
            throw new StorageUnavailableException(failure);
        }
    }

    @Override
    public void destroy() {
        s3.close();
    }
}
