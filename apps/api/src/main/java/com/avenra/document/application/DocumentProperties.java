package com.avenra.document.application;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/**
 * Document storage and malware scanning settings (ADR-019, ADR-021). The largest accepted file is
 * {@code avenra.web.max-upload-size}, shared with the request size limit.
 *
 * @param storage the private S3-compatible bucket
 * @param scanner the ClamAV daemon
 */
@Validated
@ConfigurationProperties("avenra.documents")
public record DocumentProperties(
        @Valid @NotNull Storage storage,
        @Valid @NotNull @DefaultValue Scanner scanner) {

    /**
     * @param endpoint S3 endpoint; required for S3-compatible services other than AWS
     * @param pathStyle address the bucket in the path (needed by most S3-compatible services)
     */
    public record Storage(
            URI endpoint,
            @NotBlank @DefaultValue("us-east-1") String region,
            @NotBlank String bucket,
            @NotBlank String accessKey,
            @NotBlank String secretKey,
            @DefaultValue("true") boolean pathStyle) {

        @Override
        public String toString() {
            return "Storage[endpoint=" + endpoint + ", region=" + region + ", bucket=" + bucket + "]";
        }
    }

    public record Scanner(
            @NotBlank @DefaultValue("localhost") String host,
            @Min(1) @Max(65535) @DefaultValue("3310") int port,
            @NotNull @DefaultValue("2s") Duration connectTimeout,
            @NotNull @DefaultValue("60s") Duration scanTimeout) {}
}
