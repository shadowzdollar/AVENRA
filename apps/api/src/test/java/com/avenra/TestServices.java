package com.avenra;

import java.net.URI;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

/**
 * Real infrastructure for integration tests besides PostgreSQL: Redis (rate limiting), S3-compatible
 * storage (SeaweedFS, as in local development), ClamAV (malware scanning, with the signatures
 * bundled in its image), and a fresh random encryption key per test run, so no key material is ever
 * committed. Each container starts once per JVM.
 */
public final class TestServices {

    public static final String S3_BUCKET = "avenra-test";
    private static final String S3_ACCESS_KEY = "test-access-" + random(6);
    private static final String S3_SECRET_KEY = "test-secret-" + random(12);

    private static final GenericContainer<?> REDIS = new GenericContainer<>("redis:8.10.2").withExposedPorts(6379);

    private static final GenericContainer<?> S3 = new GenericContainer<>("chrislusf/seaweedfs:4.48")
            .withExposedPorts(8333)
            .withEnv("S3_ACCESS_KEY", S3_ACCESS_KEY)
            .withEnv("S3_SECRET_KEY", S3_SECRET_KEY)
            .withCreateContainerCmdModifier(cmd -> cmd.withEntrypoint("/bin/sh", "-c"))
            // One argument: the whole shell script.
            .withCommand(new String[] {"printf '{\"identities\":[{\"name\":\"avenra\",\"credentials\":[{\"accessKey\":\"%s\","
                    + "\"secretKey\":\"%s\"}],\"actions\":[\"Admin\",\"Read\",\"Write\",\"List\",\"Tagging\"]}]}' "
                    + "\"$S3_ACCESS_KEY\" \"$S3_SECRET_KEY\" > /tmp/s3.json && "
                    + "exec weed server -dir=/data -s3 -s3.port=8333 -s3.config=/tmp/s3.json -ip.bind=0.0.0.0"})
            .waitingFor(Wait.forHttp("/").forPort(8333).forStatusCodeMatching(status -> status < 500))
            .withStartupTimeout(Duration.ofMinutes(2));

    private static final GenericContainer<?> CLAMAV = new GenericContainer<>("clamav/clamav:1.5.4")
            .withExposedPorts(3310)
            // Tests use the signatures bundled in the image; no downloads.
            .withEnv("CLAMAV_NO_FRESHCLAMD", "true")
            .withEnv("CLAMD_CONF_StreamMaxLength", "30M")
            .waitingFor(Wait.forLogMessage(".*socket found, clamd started.*", 1))
            .withStartupTimeout(Duration.ofMinutes(5));

    public static final String CRYPTO_KEY_ID = "test1";
    private static final String CRYPTO_KEY = randomKey();

    private static boolean bucketCreated;

    private TestServices() {}

    public static synchronized String redisUrl() {
        start(REDIS);
        return "redis://" + REDIS.getHost() + ":" + REDIS.getMappedPort(6379);
    }

    public static synchronized URI s3Endpoint() {
        start(S3);
        URI endpoint = URI.create("http://" + S3.getHost() + ":" + S3.getMappedPort(8333));
        if (!bucketCreated) {
            try (var client = s3Client(endpoint)) {
                client.createBucket(request -> request.bucket(S3_BUCKET));
            }
            bucketCreated = true;
        }
        return endpoint;
    }

    public static synchronized String clamdHost() {
        start(CLAMAV);
        return CLAMAV.getHost();
    }

    public static synchronized int clamdPort() {
        start(CLAMAV);
        return CLAMAV.getMappedPort(3310);
    }

    /** A client for the test bucket, to inspect what the application stored. */
    public static S3Client s3Client() {
        return s3Client(s3Endpoint());
    }

    private static S3Client s3Client(URI endpoint) {
        return S3Client.builder()
                .endpointOverride(endpoint)
                .region(Region.US_EAST_1)
                .forcePathStyle(true)
                .httpClientBuilder(UrlConnectionHttpClient.builder())
                .credentialsProvider(
                        StaticCredentialsProvider.create(AwsBasicCredentials.create(S3_ACCESS_KEY, S3_SECRET_KEY)))
                .build();
    }

    /** Everything besides the database, as property name to value. */
    public static Map<String, Object> properties() {
        var properties = new HashMap<String, Object>();
        properties.put("AVENRA_REDIS_URL", redisUrl());
        properties.put("AVENRA_CRYPTO_ACTIVE_KEY_ID", CRYPTO_KEY_ID);
        properties.put("avenra.crypto.keys." + CRYPTO_KEY_ID, CRYPTO_KEY);
        properties.put("AVENRA_S3_ENDPOINT", s3Endpoint().toString());
        properties.put("AVENRA_S3_BUCKET", S3_BUCKET);
        properties.put("AVENRA_S3_ACCESS_KEY", S3_ACCESS_KEY);
        properties.put("AVENRA_S3_SECRET_KEY", S3_SECRET_KEY);
        properties.put("AVENRA_CLAMD_HOST", clamdHost());
        properties.put("AVENRA_CLAMD_PORT", clamdPort());
        return Map.copyOf(properties);
    }

    public static void register(DynamicPropertyRegistry registry) {
        properties().forEach((name, value) -> registry.add(name, () -> value));
    }

    private static void start(GenericContainer<?> container) {
        if (!container.isRunning()) {
            container.start();
        }
    }

    private static String randomKey() {
        byte[] key = new byte[32];
        new SecureRandom().nextBytes(key);
        return Base64.getEncoder().encodeToString(key);
    }

    private static String random(int bytes) {
        byte[] value = new byte[bytes];
        new SecureRandom().nextBytes(value);
        return java.util.HexFormat.of().formatHex(value);
    }
}
