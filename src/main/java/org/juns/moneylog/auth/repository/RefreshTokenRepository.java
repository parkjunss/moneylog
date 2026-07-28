package org.juns.moneylog.auth.repository;

import org.juns.moneylog.auth.domain.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RefreshTokenRepository
        extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    Optional<RefreshToken> findByUserId(Long userId);

    void deleteByToken(String token);

    void deleteByUserId(Long userId);

    void deleteAllByExpiresAtBefore(LocalDateTime now);
}
