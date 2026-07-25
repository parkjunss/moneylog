package org.juns.moneylog.config.swagger;

import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.OpenAPI;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Money Log")
                        .version("1.0")
                        .description("Money Log API")
                );
    }

    @Bean
    public GroupedOpenApi customGroupedOpenAPI() {
        String[] paths = { "/api/vi/**" };
        String[] packagesToScan = { "com.example.spingdoc" };
        return GroupedOpenApi.builder()
                .group("Money Log")
                .pathsToMatch(paths)
                .packagesToScan(packagesToScan)
                .build();
    }
}
