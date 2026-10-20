package com.avenra.integration.infrastructure;

import com.avenra.integration.IntegrationProperties;
import com.avenra.integration.domain.AddressPolicy;
import com.avenra.integration.domain.Outcome;
import com.avenra.integration.domain.Settings;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.URI;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.function.Supplier;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.S3Exception;

/**
 * Writes completion exports to an organization's own S3-compatible bucket (ADR-034) and verifies
 * each object by reading it back and comparing its SHA-256.
 */
@Component
public class StorageExporter {

    /** One object to write: its key under the export folder, its content and its SHA-256. */
    public record Item(String key, String contentType, Supplier<InputStream> content, long length, String sha256Hex) {}

    private final IntegrationProperties properties;

    StorageExporter(IntegrationProperties properties) {
        this.properties = properties;
    }

    public Outcome export(Settings settings, String accessKey, String secretKey, List<Item> items) {
        URI endpoint = null;
        try {
            if (settings.endpoint() != null && !settings.endpoint().isBlank()) {
                endpoint = URI.create(settings.endpoint());
                AddressPolicy.check(endpoint, properties.allowLoopbackHttp(), InetAddress::getAllByName);
            }
        } catch (AddressPolicy.AddressRefused refused) {
            return Outcome.fail(null, refused.getMessage());
        } catch (IllegalArgumentException malformed) {
            return Outcome.fail(null, "The storage address is not valid.");
        }
        var builder = S3Client.builder()
                .region(Region.of(
                        settings.region() == null || settings.region().isBlank() ? "us-east-1" : settings.region()))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
                .httpClientBuilder(UrlConnectionHttpClient.builder()
                        .connectionTimeout(Duration.ofSeconds(5))
                        .socketTimeout(Duration.ofSeconds(60)))
                .forcePathStyle(Boolean.TRUE.equals(settings.pathStyle()));
        if (endpoint != null) {
            builder.endpointOverride(endpoint);
        }
        String prefix = folder(settings.prefix());
        try (S3Client s3 = builder.build()) {
            for (Item item : items) {
                try (InputStream in = item.content().get()) {
                    s3.putObject(
                            put -> put.bucket(settings.bucket())
                                    .key(prefix + item.key())
                                    .contentType(item.contentType()),
                            RequestBody.fromInputStream(in, item.length()));
                }
                String stored;
                try (InputStream back =
                        s3.getObject(get -> get.bucket(settings.bucket()).key(prefix + item.key()))) {
                    stored = sha256(back);
                }
                if (!stored.equals(item.sha256Hex())) {
                    return Outcome.fail(null, "An exported file did not match after writing: " + item.key());
                }
            }
            return Outcome.ok(null);
        } catch (S3Exception refused) {
            int status = refused.statusCode();
            String code = refused.awsErrorDetails() == null
                    ? ""
                    : refused.awsErrorDetails().errorCode();
            if (status == 429 || status >= 500) {
                return Outcome.retry(status, "The storage service answered " + status + ".");
            }
            return Outcome.fail(status, "The storage service refused the export (" + status + " " + code + ").");
        } catch (SdkClientException | IOException unreachable) {
            return Outcome.retry(null, "The storage service could not be reached.");
        }
    }

    /** The export folder with exactly one trailing slash, or none at the bucket root. */
    static String folder(String prefix) {
        if (prefix == null || prefix.isBlank()) {
            return "";
        }
        String trimmed = prefix.strip().replaceAll("^/+", "").replaceAll("/+$", "");
        return trimmed.isEmpty() ? "" : trimmed + "/";
    }

    static String sha256(InputStream in) throws IOException {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[64 * 1024];
            int read;
            while ((read = in.read(buffer)) != -1) {
                digest.update(buffer, 0, read);
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }
}
