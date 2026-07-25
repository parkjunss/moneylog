package org.juns.moneylog.auth.service;

import lombok.RequiredArgsConstructor;
import org.juns.moneylog.auth.domain.RefreshToken;
import org.juns.moneylog.auth.dto.RotatedToken;
import org.juns.moneylog.auth.repository.RefreshTokenRepository;
import org.juns.moneylog.config.exception.AuthenticationFailedException;
import org.juns.moneylog.user.domain.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RefreshTokenService {

    private static final SecureRandom random = new SecureRandom();
    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    private LocalDateTime expiresAt() {
        return LocalDateTime.now().plus(
                Duration.ofMillis(refreshTokenExpirationMs)
        );
    }

    private static String generate() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private static String hash(String value) {
        try {
            byte[] digest = MessageDigest
                    .getInstance("SHA-256")
                    .digest(
                            value.getBytes(
                                    StandardCharsets.UTF_8
                            )
                    );

            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256을 사용할 수 없습니다.",
                    exception
            );
        }
    }

    @Transactional
    public String issueRefreshToken(User user) {
        String rawToken = generate();
        String tokenHash = hash(rawToken);
        LocalDateTime expiresAt = expiresAt();

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
    public RotatedToken rotateRefreshToken(String refreshToken) {

        RefreshToken saved = refreshTokenRepository.findByToken(hash(refreshToken))
                .orElseThrow(() -> new AuthenticationFailedException("유효하지 않은 refresh token입니다."));

        if (saved.isExpired()) {
            refreshTokenRepository.delete(saved);
            throw new AuthenticationFailedException("만료된 refresh token입니다.");
        }

        String nextRefreshToken = generate();
        saved.update(hash(nextRefreshToken), expiresAt());

        return new RotatedToken(saved.getUser(), nextRefreshToken);
    }

    @Transactional
    public void revokeRefreshToken(String refreshToken) {
        if(refreshToken == null ||  refreshToken.isBlank()) {
            return;
        }
        refreshTokenRepository.deleteByToken(hash(refreshToken));
    }
}
