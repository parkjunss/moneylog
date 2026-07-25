package org.juns.moneylog.user.service;

import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.juns.moneylog.config.enums.Provider;
import org.juns.moneylog.config.enums.RoleType;
import org.juns.moneylog.user.domain.OAuthAccount;
import org.juns.moneylog.user.domain.Role;
import org.juns.moneylog.user.domain.User;
import org.juns.moneylog.user.repository.OAuthAccountRepository;
import org.juns.moneylog.user.repository.RoleRepository;
import org.juns.moneylog.user.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CustomOAuth2UserService
        extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OAuthAccountRepository oAuthAccountRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(
            @NonNull OAuth2UserRequest request
    ) {
        OAuth2User principal = super.loadUser(request);

        if (!Boolean.TRUE.equals(
                principal.<Boolean>getAttribute("email_verified")
        )) {
            throw oauthError(
                    "email_not_verified",
                    "Google 이메일 인증이 필요합니다."
            );
        }

        String providerUserId = required(principal, "sub");
        String email = required(principal, "email")
                .trim()
                .toLowerCase(Locale.ROOT);

        oAuthAccountRepository
                .findByProviderAndProviderUserId(
                        Provider.GOOGLE,
                        providerUserId
                )
                .orElseGet(() ->
                        createAccount(providerUserId, email)
                );

        return principal;
    }

    public User requireUser(OAuth2User principal) {
        return oAuthAccountRepository
                .findByProviderAndProviderUserId(
                        Provider.GOOGLE,
                        required(principal, "sub")
                )
                .map(OAuthAccount::getUser)
                .orElseThrow(() ->
                        oauthError(
                                "user_not_found",
                                "Google 사용자를 찾을 수 없습니다."
                        )
                );
    }

    private OAuthAccount createAccount(
            String providerUserId,
            String email
    ) {
        if (userRepository.existsByEmail(email)) {
            throw oauthError(
                    "email_already_exists",
                    "같은 이메일의 기존 계정이 있습니다."
            );
        }

        Role role = roleRepository
                .findByName(RoleType.ROLE_USER)
                .orElseThrow(() ->
                        oauthError(
                                "role_not_found",
                                "ROLE_USER가 초기화되지 않았습니다."
                        )
                );

        Set<Role> roles = new HashSet<>();
        roles.add(role);

        User user = userRepository.save(
                User.builder()
                        .email(email)
                        .username(
                                "google_" + providerUserId.substring(
                                        Math.max(
                                                0,
                                                providerUserId.length() - 43
                                        )
                                )
                        )
                        .roles(roles)
                        .build()
        );

        return oAuthAccountRepository.save(
                OAuthAccount.builder()
                        .user(user)
                        .provider(Provider.GOOGLE)
                        .providerUserId(providerUserId)
                        .build()
        );
    }

    private static String required(
            OAuth2User principal,
            String attribute
    ) {
        String value = principal.getAttribute(attribute);
        if (value == null || value.isBlank()) {
            throw oauthError(
                    "missing_attribute",
                    "Google 사용자 정보가 부족합니다: " + attribute
            );
        }
        return value;
    }

    private static OAuth2AuthenticationException oauthError(
            String code,
            String message
    ) {
        return new OAuth2AuthenticationException(
                new OAuth2Error(code),
                message
        );
    }
}
