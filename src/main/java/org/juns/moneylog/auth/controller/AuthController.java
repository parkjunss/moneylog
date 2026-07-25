package org.juns.moneylog.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.juns.moneylog.auth.dto.AuthTokenResponse;
import org.juns.moneylog.auth.dto.LoginRequest;
import org.juns.moneylog.auth.service.AuthService;
import org.juns.moneylog.config.security.RefreshTokenCookieManager;
import org.juns.moneylog.user.domain.User;
import org.juns.moneylog.user.dto.UserCreateRequest;
import org.juns.moneylog.user.dto.UserResponse;
import org.juns.moneylog.user.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth API", description = "Auth API 입니다.")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final RefreshTokenCookieManager cookieManager;


    @PostMapping("/signup")
    public ResponseEntity<UserResponse> signUp(@Valid @RequestBody UserCreateRequest userCreateRequest) {
        UserResponse user = userService.createUser(userCreateRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }


    @PostMapping("/login")
    @Tag(name = "Auth API")
    @Operation(summary = "Login", description = "User Login")
    public AuthTokenResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        AuthTokenResponse tokens = authService.login(request);

        cookieManager.add(
                response,
                tokens.refreshToken()
        );

        return accessTokenOnly(tokens);
    }

    @PostMapping("/logout")
    @Tag(name = "Auth API")
    @Operation(summary = "Logout", description = "User Logout")
    public ResponseEntity<Void> logout(
            @CookieValue(
                    value = "refreshToken",
                    required = false
            )
            String refreshToken,
            HttpServletResponse response
    ) {
        authService.logout(refreshToken);
        cookieManager.delete(response);

        return ResponseEntity.noContent().build();
    }


    private static AuthTokenResponse accessTokenOnly(
            AuthTokenResponse tokens
    ) {
        return new AuthTokenResponse(
                tokens.accessToken(),
                null
        );
    }

    @PostMapping("/reissue")
    public AuthTokenResponse reissue(
            @CookieValue("refreshToken")
            String refreshToken,
            HttpServletResponse response
    ) {
        AuthTokenResponse tokens =
                authService.reissueRefreshToken(refreshToken);

        cookieManager.add(
                response,
                tokens.refreshToken()
        );

        return accessTokenOnly(tokens);
    }

}