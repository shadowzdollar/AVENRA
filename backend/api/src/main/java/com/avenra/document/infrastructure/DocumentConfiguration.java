package com.avenra.document.infrastructure;

import com.avenra.document.application.DocumentProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(DocumentProperties.class)
class DocumentConfiguration {}
