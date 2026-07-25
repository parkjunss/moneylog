package org.juns.moneylog.config.handler;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.juns.moneylog.auth.dto.AuthTokenResponse;
import org.juns.moneylog.auth.service.AuthService;
import org.juns.moneylog.config.security.RefreshTokenCookieManager;
import org.juns.moneylog.user.domain.User;
import org.juns.moneylog.user.service.CustomOAuth2UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class OAuth2LoginHandler implements AuthenticationSuccessHandler, AuthenticationFailureHandler {
    private final CustomOAuth2UserService oAuth2UserService;
    private final AuthService authService;
    private final RefreshTokenCookieManager cookieManager;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Authentication authentication) throws IOException {
        try {
            OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
            User user = oAuth2UserService.requireUser(token.getPrincipal());

            AuthTokenResponse tokens = authService.issueToken(user);

            cookieManager.add(response, tokens.refreshToken());

            redirect(
                    response,
                    "#accessToken=" + encode(tokens.accessToken())
            );

        } catch (OAuth2AuthenticationException exception) {
            onAuthenticationFailure(request, response, exception);
        }

    }


    @Override
    public void onAuthenticationFailure(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull AuthenticationException exception
    ) throws IOException {
        redirect(response, "?oauthError=1");
    }

    private void redirect(HttpServletResponse response, String fragment) throws IOException {
        String base = frontendUrl.endsWith("/")
                ? frontendUrl.substring(0, frontendUrl.length() - 1)
                : frontendUrl;
        response.sendRedirect(base + "/login" + fragment);
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }




}
