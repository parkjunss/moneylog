# Moneylog JWT / User Auth 수정 가이드

작성 기준: 2026-07-24 현재 소스  
목적: 실제 소스는 수정하지 않고, 작성자가 직접 고칠 수 있도록 문제와 교체 코드를 한곳에 정리한다.

## 1. 재점검 결과

현재 `.\gradlew.bat compileJava`의 첫 실패는 다음 두 건이다.

```text
AuthController.java:52: cannot find symbol: class CookieValue
AuthController.java:71: cannot find symbol: class CookieValue
```

하지만 `CookieValue` import만 추가해서는 끝나지 않는다. 그 다음에는 아래 문제가 남는다.

| 우선순위 | 현재 문제 | 결과 |
|---|---|---|
| P0 | `SecurityConfig.anyRequest().permitAll()` | 모든 사용자 데이터 API가 공개됨 |
| P0 | JWT를 읽는 Resource Server/필터가 없음 | Bearer access token을 보내도 인증되지 않음 |
| P0 | access token과 refresh token을 같은 `createToken()`으로 생성 | 두 토큰의 권한과 만료시간이 같음 |
| P0 | `AuthService.reissue()`, `logout()` 없음 | 컨트롤러 호출 대상이 없음 |
| P0 | 컨트롤러의 쿠키 추가/삭제 메서드가 없음 | 로그인/재발급/로그아웃 컴파일 불가 |
| P0 | `${access-token-expiration-ms}` 경로가 YAML과 다름 | 애플리케이션 시작 실패 |
| P0 | refresh 만료를 `plusDays(expirationTime * 1_000_000)`으로 계산 | 사실상 잘못된 만료시간 |
| P0 | `UserService.createUser()`가 `save()`하지 않음 | 회원가입 성공처럼 보여도 DB에 저장 안 됨 |
| P0 | Google OAuth 속성 이름이 실제 Google 응답과 다름 | OAuth 로그인 중 NullPointerException 가능 |
| P1 | `User.isEnabled()`가 필드를 무시하고 항상 true 반환 | 비활성 계정도 로그인 가능 |
| P1 | refresh token 원문을 DB에 저장 | DB 유출 시 토큰을 바로 사용할 수 있음 |
| P1 | refresh token 조회에 잠금이 없음 | 같은 토큰으로 동시 재발급 가능 |
| P1 | 로그인/회원가입 DTO 검증 부족 | null, 빈 문자열, 잘못된 이메일 허용 |
| P1 | 잘못된 로그인/refresh 예외 매핑 없음 | 401 대신 500 가능 |
| P1 | 초기 관리자 비밀번호가 코드에 고정됨 | 배포 시 알려진 관리자 계정 생성 |
| P2 | OAuth 사용자 처리가 두 서비스에 중복됨 | 어느 서비스가 진짜 진입점인지 불명확 |
| P2 | 초기화 Runner가 두 군데 존재 | 동일 초기화가 두 번 실행됨 |

## 2. 목표 인증 흐름

```text
일반 회원가입
  POST /api/auth/signup
  -> UserService에서 검증/저장

일반 로그인
  POST /api/auth/login
  -> 비밀번호/계정 상태 확인
  -> 짧은 JWT access token 응답
  -> 긴 opaque refresh token은 HttpOnly 쿠키

API 요청
  Authorization: Bearer <access-token>
  -> Spring Security Resource Server가 JWT 검증
  -> /api/users/**, /api/money-logs/** 인증 필요

재발급
  POST /api/auth/reissue
  -> 쿠키의 refresh token을 SHA-256 해시해 DB 조회
  -> 만료/재사용 확인
  -> DB 행 잠금 후 refresh token 교체
  -> 새 access token 응답

Google OAuth
  Google -> CustomOAuth2UserService
  -> Google의 sub/email/name/email_verified 사용
  -> 사용자 조회 또는 생성
  -> OAuth2LoginHandler에서 일반 로그인과 같은 토큰 발급
```

## 3. 적용 순서

아래 순서대로 수정해야 중간 컴파일 오류를 줄일 수 있다.

1. `build.gradle`에 Resource Server 추가
2. JWT 설정 경로 및 Security 설정 수정
3. RefreshToken 저장/조회 코드 수정
4. `JwtService` 수정
5. `AuthService`, `AuthController`, 쿠키 관리자 수정
6. User 저장/상태/DTO 수정
7. OAuth 서비스를 하나로 통합
8. 예외 처리와 초기 데이터 수정
9. 기존 refresh token 데이터 삭제 후 빌드/테스트

---

## 4. `build.gradle`

현재 JJWT 중복 의존성은 이미 제거되어 있다. Spring Security 방식만 유지하고 다음 한 줄을 추가한다.

```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-security-oauth2-client'
    implementation 'org.springframework.boot:spring-boot-starter-security-oauth2-resource-server'

    // 나머지 기존 의존성 유지
}
```

`io.jsonwebtoken:*`은 다시 추가하지 않는다. 현재 코드는 Spring의 `JwtEncoder`/`JwtDecoder`를 사용한다.

---

## 5. `application.yaml`

기존 `app.jwt` 설정은 유지하고 쿠키의 Secure 여부만 환경별로 조절한다.

```yaml
app:
  jwt:
    secret: ${JWT_SECRET}
    access-token-expiration-ms: ${JWT_ACCESS_TOKEN_EXPIRATION_MS:900000}
    refresh-token-expiration-ms: ${JWT_REFRESH_TOKEN_EXPIRATION_MS:1209600000}
  cookie:
    secure: ${COOKIE_SECURE:false}
  frontend-url: ${FRONTEND_URL:http://localhost:5173}
```

- 로컬 HTTP 개발: `COOKIE_SECURE=false`
- HTTPS 운영: `COOKIE_SECURE=true`
- `JWT_SECRET`은 UTF-8 기준 최소 32바이트로 설정한다.

---

## 6. `SecurityConfig.java` 전체 교체안

```java
package org.juns.moneylog.config.security;

import lombok.RequiredArgsConstructor;
import org.juns.moneylog.config.handler.OAuth2LoginHandler;
import org.juns.moneylog.user.service.CustomOAuth2UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            OAuth2LoginHandler oAuth2LoginHandler,
            CustomOAuth2UserService customOAuth2UserService
    ) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                // OAuth2 인가 요청 동안에만 세션이 필요하다.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                )
                .authorizeHttpRequests(requests -> requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/auth/signup",
                                "/api/auth/login",
                                "/api/auth/reissue",
                                "/api/auth/logout"
                        ).permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/category/**").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(userInfo ->
                                userInfo.userService(customOAuth2UserService)
                        )
                        .successHandler(oAuth2LoginHandler)
                        .failureHandler(oAuth2LoginHandler)
                )
                .oauth2ResourceServer(resourceServer -> resourceServer
                        .jwt(jwt -> jwt
                                .jwtAuthenticationConverter(jwtAuthenticationConverter())
                        )
                );

        return http.build();
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authorities =
                new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName("roles");
        authorities.setAuthorityPrefix("");

        JwtAuthenticationConverter converter =
                new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${app.frontend-url}") String frontendUrl
    ) {
        String allowedOrigin = frontendUrl.endsWith("/")
                ? frontendUrl.substring(0, frontendUrl.length() - 1)
                : frontendUrl;

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigin));
        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        );
        configuration.setAllowedHeaders(
                List.of("Authorization", "Content-Type")
        );
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

이 구조에서는 수동 비밀번호 검증을 사용하므로 기존 `AuthenticationManager` Bean과 사용하지 않는 `CustomUserDetailsService`는 제거해도 된다.

---

## 7. `JwtConfig.java` 전체 교체안

issuer까지 검증해야 다른 용도로 발급된 JWT를 받지 않는다.

```java
package org.juns.moneylog.config.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
public class JwtConfig {

    @Bean
    SecretKey jwtSecretKey(@Value("${app.jwt.secret}") String secret) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET는 32바이트 이상이어야 합니다."
            );
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey secretKey) {
        return NimbusJwtEncoder.withSecretKey(secretKey).build();
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey secretKey) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder
                .withSecretKey(secretKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        decoder.setJwtValidator(
                JwtValidators.createDefaultWithIssuer("moneylog")
        );
        return decoder;
    }
}
```

---

## 8. `RefreshToken.java` 수정안

필드 이름 `token`은 그대로 두되 실제 값은 원문이 아니라 SHA-256 해시를 저장한다. 그러면 불필요한 컬럼 rename 없이 보안을 개선할 수 있다.

한 사용자당 refresh token 하나만 허용하는 현재 정책을 유지한다.

```java
package org.juns.moneylog.auth.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.juns.moneylog.user.domain.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "refresh_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // refresh token 원문이 아니라 SHA-256 결과를 저장한다.
    @Column(nullable = false, unique = true, length = 64)
    private String token;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Builder
    private RefreshToken(
            User user,
            String token,
            LocalDateTime expiresAt
    ) {
        this.user = user;
        this.token = token;
        this.expiresAt = expiresAt;
    }

    public void update(String token, LocalDateTime expiresAt) {
        this.token = token;
        this.expiresAt = expiresAt;
    }

    public boolean isExpired() {
        return !expiresAt.isAfter(LocalDateTime.now());
    }
}
```

여러 기기에서 동시에 로그인해야 할 때만 `user_id unique`를 제거하고 device/session 단위 모델을 추가한다. 지금은 한 사용자당 하나가 가장 단순하다.

---

## 9. `RefreshTokenRepository.java` 전체 교체안

재발급 시 같은 refresh token이 동시에 두 번 성공하지 않도록 행 잠금을 건다.

```java
package org.juns.moneylog.auth.repository;

import jakarta.persistence.LockModeType;
import org.juns.moneylog.auth.domain.RefreshToken;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;

public interface RefreshTokenRepository
        extends JpaRepository<RefreshToken, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = "user")
    Optional<RefreshToken> findByToken(String token);

    Optional<RefreshToken> findByUserId(Long userId);

    void deleteByToken(String token);
}
```

---

## 10. `JwtService.java` 전체 교체안

JWT는 access token에만 사용한다. Refresh token은 `SecureRandom`으로 만든 opaque 문자열이다.

```java
package org.juns.moneylog.auth.service;

import lombok.RequiredArgsConstructor;
import org.juns.moneylog.auth.domain.RefreshToken;
import org.juns.moneylog.auth.repository.RefreshTokenRepository;
import org.juns.moneylog.user.domain.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class JwtService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final JwtEncoder jwtEncoder;
    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;

    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    public String createAccessToken(User user) {
        Instant issuedAt = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuedAt(issuedAt)
                .issuer("moneylog")
                .expiresAt(
                        issuedAt.plusMillis(accessTokenExpirationMs)
                )
                .subject(user.getEmail())
                .claim(
                        "roles",
                        user.getAuthorities().stream()
                                .map(GrantedAuthority::getAuthority)
                                .toList()
                )
                .build();

        JwsHeader header = JwsHeader
                .with(MacAlgorithm.HS256)
                .build();

        return jwtEncoder.encode(
                JwtEncoderParameters.from(header, claims)
        ).getTokenValue();
    }

    @Transactional
    public String issueRefreshToken(User user) {
        String rawToken = newRefreshToken();
        String tokenHash = hash(rawToken);
        LocalDateTime expiresAt = refreshExpiresAt();

        refreshTokenRepository.findByUserId(user.getId())
                .ifPresentOrElse(
                        saved -> saved.update(tokenHash, expiresAt),
                        () -> refreshTokenRepository.save(
                                RefreshToken.builder()
                                        .user(user)
                                        .token(tokenHash)
                                        .expiresAt(expiresAt)
                                        .build()
                        )
                );

        return rawToken;
    }

    @Transactional
    public RotatedRefreshToken rotateRefreshToken(String rawToken) {
        RefreshToken saved = refreshTokenRepository
                .findByToken(hash(rawToken))
                .orElseThrow(JwtService::invalidRefreshToken);

        if (saved.isExpired()) {
            refreshTokenRepository.delete(saved);
            throw invalidRefreshToken();
        }

        String nextRawToken = newRefreshToken();
        saved.update(
                hash(nextRawToken),
                refreshExpiresAt()
        );

        return new RotatedRefreshToken(
                saved.getUser(),
                nextRawToken
        );
    }

    @Transactional
    public void deleteRefreshToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        refreshTokenRepository.deleteByToken(hash(rawToken));
    }

    private LocalDateTime refreshExpiresAt() {
        return LocalDateTime.now().plus(
                Duration.ofMillis(refreshTokenExpirationMs)
        );
    }

    private static String newRefreshToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private static String hash(String value) {
        try {
            byte[] digest = MessageDigest
                    .getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256을 사용할 수 없습니다.",
                    exception
            );
        }
    }

    private static BadCredentialsException invalidRefreshToken() {
        return new BadCredentialsException(
                "유효하지 않은 refresh token입니다."
        );
    }

    public record RotatedRefreshToken(
            User user,
            String value
    ) {
    }
}
```

---

## 11. `AuthService.java` 전체 교체안

수동 로그인 방식을 유지하고 사용하지 않는 `AuthenticationManager`, `RoleRepository` 의존성을 제거한다.

```java
package org.juns.moneylog.auth.service;

import lombok.RequiredArgsConstructor;
import org.juns.moneylog.auth.dto.AuthTokenResponse;
import org.juns.moneylog.auth.dto.LoginRequest;
import org.juns.moneylog.user.domain.User;
import org.juns.moneylog.user.dto.UserCreateRequest;
import org.juns.moneylog.user.repository.UserRepository;
import org.juns.moneylog.user.service.UserService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserService userService;

    @Transactional
    public void signup(UserCreateRequest request) {
        userService.createUser(request);
    }

    @Transactional
    public AuthTokenResponse login(LoginRequest request) {
        String email = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        User user = userRepository.findByEmail(email)
                .orElseThrow(AuthService::badCredentials);

        if (!user.isEnabled()
                || !user.isPasswordLoginEnabled()
                || !passwordEncoder.matches(
                        request.password(),
                        user.getPassword()
                )) {
            throw badCredentials();
        }

        return issueTokens(user);
    }

    @Transactional
    public AuthTokenResponse issueTokens(User user) {
        if (!user.isEnabled()) {
            throw new BadCredentialsException(
                    "비활성화된 사용자입니다."
            );
        }

        String accessToken =
                jwtService.createAccessToken(user);
        String refreshToken =
                jwtService.issueRefreshToken(user);

        return AuthTokenResponse.from(
                accessToken,
                refreshToken
        );
    }

    @Transactional
    public AuthTokenResponse reissue(String refreshToken) {
        JwtService.RotatedRefreshToken rotated =
                jwtService.rotateRefreshToken(refreshToken);

        if (!rotated.user().isEnabled()) {
            jwtService.deleteRefreshToken(rotated.value());
            throw new BadCredentialsException(
                    "비활성화된 사용자입니다."
            );
        }

        return AuthTokenResponse.from(
                jwtService.createAccessToken(rotated.user()),
                rotated.value()
        );
    }

    @Transactional
    public void logout(String refreshToken) {
        jwtService.deleteRefreshToken(refreshToken);
    }

    private static BadCredentialsException badCredentials() {
        return new BadCredentialsException(
                "이메일 또는 비밀번호가 올바르지 않습니다."
        );
    }
}
```

---

## 12. `RefreshTokenCookieManager.java` 전체 교체안

빈 `add()`, `delete()`와 별도 `addRefreshTokenCookie()`를 하나의 API로 정리한다.

```java
package org.juns.moneylog.config.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class RefreshTokenCookieManager {

    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    @Value("${app.cookie.secure:false}")
    private boolean secure;

    public void add(
            HttpServletResponse response,
            String refreshToken
    ) {
        ResponseCookie cookie = ResponseCookie
                .from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(
                        Duration.ofMillis(
                                refreshTokenExpirationMs
                        )
                )
                .build();

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookie.toString()
        );
    }

    public void delete(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie
                .from("refreshToken", "")
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(Duration.ZERO)
                .build();

        response.addHeader(
                HttpHeaders.SET_COOKIE,
                cookie.toString()
        );
    }
}
```

---

## 13. `AuthController.java` 전체 교체안

```java
package org.juns.moneylog.auth.controller;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.juns.moneylog.auth.dto.AuthTokenResponse;
import org.juns.moneylog.auth.dto.LoginRequest;
import org.juns.moneylog.auth.service.AuthService;
import org.juns.moneylog.config.security.RefreshTokenCookieManager;
import org.juns.moneylog.user.dto.UserCreateRequest;
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
public class AuthController {
    private final AuthService authService;
    private final RefreshTokenCookieManager cookieManager;

    @PostMapping("/signup")
    public ResponseEntity<Void> signup(
            @Valid @RequestBody UserCreateRequest request
    ) {
        authService.signup(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .build();
    }

    @PostMapping("/login")
    public AuthTokenResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        AuthTokenResponse tokens =
                authService.login(request);
        cookieManager.add(
                response,
                tokens.refreshToken()
        );
        return accessTokenOnly(tokens);
    }

    @PostMapping("/reissue")
    public AuthTokenResponse reissue(
            @CookieValue("refreshToken")
            String refreshToken,
            HttpServletResponse response
    ) {
        AuthTokenResponse tokens =
                authService.reissue(refreshToken);
        cookieManager.add(
                response,
                tokens.refreshToken()
        );
        return accessTokenOnly(tokens);
    }

    @PostMapping("/logout")
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
}
```

---

## 14. 로그인/회원가입 DTO

### `LoginRequest.java`

```java
package org.juns.moneylog.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank
        @Email
        @Size(max = 254)
        String email,

        @NotBlank
        @Size(min = 8, max = 72)
        String password
) {
}
```

### `UserCreateRequest.java`

```java
package org.juns.moneylog.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
        @NotBlank
        @Size(min = 2, max = 50)
        String username,

        @NotBlank
        @Email
        @Size(max = 254)
        String email,

        @NotBlank
        @Size(min = 8, max = 72)
        String password
) {
}
```

기존 `SignUpRequest.java`는 사용처가 없으므로 삭제한다.

---

## 15. `User.java` 핵심 수정

전체 엔티티를 다시 만들 필요는 없다. 다음 부분만 수정한다.

### 테이블 제약과 필드

```java
@Entity
@Table(
        name = "users",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_users_provider_provider_id",
                columnNames = {"provider", "provider_id"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class User implements UserDetails {

    // ...

    @Column(unique = true, nullable = false, length = 254)
    private String email;

    @Column(nullable = false, length = 100)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Provider provider;

    @Column(name = "provider_id", length = 255)
    private String providerId;

    // ...
}
```

클래스의 `@ToString`은 제거한다. 현재 형태는 암호화된 비밀번호까지 로그에 출력할 수 있다.

### `isEnabled()`

```java
@Override
public boolean isEnabled() {
    return enabled;
}
```

`isAccountNonExpired()`, `isAccountNonLocked()`, `isCredentialsNonExpired()`는 항상 기본값을 반환할 목적이라면 override 자체를 삭제해도 된다.

---

## 16. `UserService.createUser()` 교체안

현재 가장 중요한 누락은 `userRepository.save()`다.

```java
@Transactional
public UserResponse createUser(
        UserCreateRequest request
) {
    String email = request.email()
            .trim()
            .toLowerCase(Locale.ROOT);
    String username = request.username().trim();

    if (userRepository.existsByEmail(email)) {
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "이미 사용 중인 이메일입니다."
        );
    }

    if (userRepository.findByUsername(username).isPresent()) {
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "이미 사용 중인 사용자명입니다."
        );
    }

    Role role = roleRepository
            .findByRoleName(RoleType.ROLE_USER)
            .orElseThrow(() ->
                    new IllegalStateException(
                            "ROLE_USER가 초기화되지 않았습니다."
                    )
            );

    User saved = userRepository.save(
            User.builder()
                    .email(email)
                    .username(username)
                    .password(
                            passwordEncoder.encode(
                                    request.password()
                            )
                    )
                    .passwordLoginEnabled(true)
                    .roles(new HashSet<>(Set.of(role)))
                    .provider(Provider.LOCAL)
                    .build()
    );

    return UserResponse.from(saved);
}
```

필요한 import:

```java
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.HashSet;
import java.util.Set;
```

---

## 17. Google OAuth 중복 제거

다음 두 파일은 삭제 대상으로 잡는다.

```text
auth/service/OAuthLoginService.java
auth/service/GoogleOAuthService.java
```

Google 사용자 조회/생성은 `CustomOAuth2UserService` 하나가 담당한다.

### `CustomOAuth2UserService.java` 전체 교체안

```java
package org.juns.moneylog.user.service;

import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.juns.moneylog.config.enums.Provider;
import org.juns.moneylog.config.enums.RoleType;
import org.juns.moneylog.user.domain.Role;
import org.juns.moneylog.user.domain.User;
import org.juns.moneylog.user.repository.RoleRepository;
import org.juns.moneylog.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.HashSet;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CustomOAuth2UserService
        extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public OAuth2User loadUser(
            @NonNull OAuth2UserRequest request
    ) {
        OAuth2User principal = super.loadUser(request);

        if (!Boolean.TRUE.equals(
                principal.<Boolean>getAttribute(
                        "email_verified"
                )
        )) {
            throw oauthError(
                    "email_not_verified",
                    "Google 이메일 인증이 필요합니다."
            );
        }

        String providerId = required(principal, "sub");
        String email = required(principal, "email")
                .trim()
                .toLowerCase(Locale.ROOT);

        userRepository
                .findByProviderIdAndProvider(
                        providerId,
                        Provider.GOOGLE
                )
                .orElseGet(() ->
                        createGoogleUser(
                                principal,
                                providerId,
                                email
                        )
                );

        return principal;
    }

    public User requireUser(OAuth2User principal) {
        String providerId = required(principal, "sub");
        return userRepository
                .findByProviderIdAndProvider(
                        providerId,
                        Provider.GOOGLE
                )
                .orElseThrow(() ->
                        oauthError(
                                "user_not_found",
                                "Google 사용자를 찾을 수 없습니다."
                        )
                );
    }

    private User createGoogleUser(
            OAuth2User principal,
            String providerId,
            String email
    ) {
        if (userRepository.existsByEmail(email)) {
            throw oauthError(
                    "email_already_exists",
                    "같은 이메일의 기존 계정이 있습니다."
            );
        }

        Role role = roleRepository
                .findByRoleName(RoleType.ROLE_USER)
                .orElseThrow(() ->
                        oauthError(
                                "role_not_found",
                                "ROLE_USER가 초기화되지 않았습니다."
                        )
                );

        String providerUsername =
                "google_" + providerId.substring(
                        Math.max(0, providerId.length() - 43)
                );

        return userRepository.save(
                User.builder()
                        .username(providerUsername)
                        .email(email)
                        // DB의 password NOT NULL 조건을 만족시키되
                        // 일반 비밀번호 로그인은 비활성화한다.
                        .password(
                                passwordEncoder.encode(
                                        UUID.randomUUID().toString()
                                )
                        )
                        .passwordLoginEnabled(false)
                        .provider(Provider.GOOGLE)
                        .providerId(providerId)
                        .roles(
                                new HashSet<>(
                                        java.util.Set.of(role)
                                )
                        )
                        .build()
        );
    }

    private static String required(
            OAuth2User principal,
            String name
    ) {
        String value = principal.getAttribute(name);
        if (value == null || value.isBlank()) {
            throw oauthError(
                    "missing_attribute",
                    "Google 사용자 정보가 부족합니다: " + name
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
```

Google의 실제 주요 속성 이름은 다음과 같다.

```text
sub
email
name
picture
email_verified
```

기존 코드의 `providerId`, `providerName`, `providerEmail`은 Google 기본 응답 이름이 아니다.

---

## 18. `OAuth2LoginHandler.java` 전체 교체안

```java
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
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class OAuth2LoginHandler
        implements AuthenticationSuccessHandler,
        AuthenticationFailureHandler {

    private final CustomOAuth2UserService oAuth2UserService;
    private final AuthService authService;
    private final RefreshTokenCookieManager cookieManager;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull Authentication authentication
    ) throws IOException {
        try {
            OAuth2AuthenticationToken token =
                    (OAuth2AuthenticationToken) authentication;
            User user = oAuth2UserService.requireUser(
                    token.getPrincipal()
            );
            AuthTokenResponse tokens =
                    authService.issueTokens(user);

            cookieManager.add(
                    response,
                    tokens.refreshToken()
            );
            redirect(
                    response,
                    "#accessToken=" + encode(
                            tokens.accessToken()
                    )
            );
        } catch (AuthenticationException exception) {
            onAuthenticationFailure(
                    request,
                    response,
                    exception
            );
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

    private void redirect(
            HttpServletResponse response,
            String suffix
    ) throws IOException {
        String base = frontendUrl.endsWith("/")
                ? frontendUrl.substring(
                        0,
                        frontendUrl.length() - 1
                )
                : frontendUrl;
        response.sendRedirect(base + "/login" + suffix);
    }

    private static String encode(String value) {
        return URLEncoder.encode(
                value,
                StandardCharsets.UTF_8
        );
    }
}
```

---

## 19. `GlobalExceptionHandler.java` 추가 처리

기존 validation 처리는 유지하고 잘못된 로그인/refresh token을 401로 변환한다.

```java
@ExceptionHandler(BadCredentialsException.class)
public ResponseEntity<Map<String, String>> handleBadCredentials(
        BadCredentialsException exception
) {
    return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(Map.of(
                    "message",
                    exception.getMessage()
            ));
}
```

필요한 import:

```java
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
```

운영에서는 로그인 실패 원인을 세밀하게 노출하지 않고 `"인증에 실패했습니다."` 같은 고정 문구를 반환해도 된다.

---

## 20. 초기 데이터 중복과 관리자 계정

현재 아래 두 Runner가 모두 `initialize()`를 호출한다.

```text
config/DataInitializer.java
config/MyInitialDataService.java의 myInitializeData()
```

`DataInitializer.java`를 삭제하고 `MyInitialDataService.myInitializeData()` 하나만 남긴다.

또한 다음 하드코딩 관리자 생성 블록은 삭제한다.

```text
admin@moneylog.com
admin1234!
```

개발 편의를 위해 반드시 자동 생성해야 한다면 최소한 환경변수로 받고 다음 조건을 지킨다.

```java
.passwordLoginEnabled(true)
```

운영에서는 관리자 생성 명령이나 DB 마이그레이션으로 한 번만 생성하는 편이 안전하다.

---

## 21. DB 반영 시 주의

이 수정안은 다음 스키마 의미를 변경한다.

- `refresh_tokens.token`: JWT 원문 -> SHA-256 해시
- `refresh_tokens.user_id`: unique
- `users.email`: 최대 254자
- `(users.provider, users.provider_id)`: 복합 unique

기존 refresh token은 새 코드에서 사용할 수 없으므로 배포 전에 삭제한다.

```sql
DELETE FROM refresh_tokens;
```

현재 `ddl-auto=update`는 개발에서는 편하지만 운영 스키마 변경을 확실히 보장하지 않는다. 운영에 올릴 때는 위 제약을 명시적인 migration으로 옮긴다.

---

## 22. 최소 검증 순서

### 1단계: 컴파일

```powershell
.\gradlew.bat clean compileJava
```

### 2단계: 테스트

```powershell
.\gradlew.bat test
```

현재 인증 테스트가 없으므로 최소한 아래 다섯 경우는 추가해야 한다.

```text
1. 회원가입 후 DB에 LOCAL 사용자와 ROLE_USER가 저장됨
2. 올바른 로그인은 서로 다른 access/refresh token을 발급함
3. 잘못된 비밀번호는 401
4. refresh token 한 번 재발급 후 이전 token 재사용은 401
5. 인증 없는 /api/users/profile 요청은 401
```

### 3단계: 수동 API 확인

회원가입:

```powershell
curl.exe -i `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"tester\",\"email\":\"tester@example.com\",\"password\":\"password123\"}' `
  http://localhost:8080/api/auth/signup
```

로그인하면서 쿠키 저장:

```powershell
curl.exe -i `
  -c cookies.txt `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"tester@example.com\",\"password\":\"password123\"}' `
  http://localhost:8080/api/auth/login
```

응답의 access token으로 보호 API 호출:

```powershell
curl.exe -i `
  -H "Authorization: Bearer ACCESS_TOKEN_HERE" `
  http://localhost:8080/api/users/profile
```

재발급:

```powershell
curl.exe -i `
  -b cookies.txt `
  -c cookies.txt `
  -X POST `
  http://localhost:8080/api/auth/reissue
```

로그아웃:

```powershell
curl.exe -i `
  -b cookies.txt `
  -X POST `
  http://localhost:8080/api/auth/logout
```

---

## 23. 이번 정리에서 일부러 넣지 않은 것

- Refresh token 다중 기기/session 테이블: 실제 요구가 생길 때 추가
- Redis blacklist: 단일 서버/DB refresh rotation으로 충분한 동안 불필요
- JWT 커스텀 필터: Spring Resource Server가 이미 처리
- 별도 인증 인터페이스/팩토리: Google 하나뿐인 현재 단계에서는 불필요
- Access token 강제 로그아웃 blacklist: 15분 만료로 처리하고 필요할 때 추가

핵심은 직접 만든 JWT 필터와 여러 인증 서비스를 늘리는 것이 아니라, Spring Security의 JWT 검증 하나와 DB refresh rotation 하나만 제대로 연결하는 것이다.
