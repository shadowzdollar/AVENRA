package com.avenra;

import org.junit.jupiter.api.Test;

@IntegrationTest
class AvenraApplicationIT extends IntegrationTestBase {

    @Test
    void applicationStartsAgainstRealDatabase() {
        // Fails if the context cannot start: migrations, schema validation, connections.
    }
}
