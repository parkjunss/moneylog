package org.juns.moneylog;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
public class MoneylogApplication {

    public static void main(String[] args) {

        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .load();

        dotenv.entries().forEach(entry -> {
            String key = entry.getKey();

            if (System.getenv(key) == null
                    && System.getProperty(key) == null) {
                System.setProperty(
                        key,
                        entry.getValue()
                );
            }
        });

        SpringApplication.run(MoneylogApplication.class, args);
    }

}
