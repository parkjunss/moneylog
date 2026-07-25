package org.juns.moneylog.config;

import lombok.RequiredArgsConstructor;
import org.juns.moneylog.category.domain.Category;
import org.juns.moneylog.category.repository.CategoryRepository;
import org.juns.moneylog.config.enums.CategoryName;
import org.juns.moneylog.config.enums.RoleType;
import org.juns.moneylog.user.domain.Role;
import org.juns.moneylog.user.domain.User;
import org.juns.moneylog.user.repository.RoleRepository;
import org.juns.moneylog.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
public class MyInitialDataService {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private final CategoryRepository categoryRepository;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.admin.username}")
    private String adminUsername;

    @Bean
    public ApplicationRunner myInitializeData() {
        return args -> initialize();
    }

    @Transactional
    public void initialize() {
        Role userRole = roleRepository.findByName(RoleType.ROLE_USER)
                .orElseGet(() -> roleRepository.save(
                        Role.builder()
                                .name(RoleType.ROLE_USER)
                                .build()
                ));

        Role adminRole = roleRepository.findByName(RoleType.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(
                        Role.builder()
                                .name(RoleType.ROLE_ADMIN)
                                .build()
                ));

        for (CategoryName categoryName : CategoryName.values()) {
            if (!categoryRepository.existsByCategoryName(categoryName)) {
                categoryRepository.save(
                        Category.builder()
                                .categoryName(categoryName)
                                .type(categoryName.getType())
                                .build()
                );
            }
        }

        if (!userRepository.existsByEmail(adminEmail)) {
            Set<Role> roles = new HashSet<>();
            roles.add(userRole);
            roles.add(adminRole);

            User admin = User.builder()
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .username(adminUsername)
                    .roles(roles)
                    .build();

            userRepository.save(admin);
        }
    }
}
