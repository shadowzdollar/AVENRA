package com.avenra.platform;

import java.time.Clock;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(AvenraProperties.class)
class PlatformConfiguration {

    /** One clock for the whole application, in UTC (Guidelines §38); tests can replace it. */
    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}
