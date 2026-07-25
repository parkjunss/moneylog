package org.juns.moneylog.auth.service;

import lombok.RequiredArgsConstructor;
import org.juns.moneylog.auth.dto.AuthTokenResponse;
import org.juns.moneylog.auth.dto.LoginRequest;
import org.juns.moneylog.auth.dto.RotatedToken;
import org.juns.moneylog.config.security.JwtTokenizer;
import org.juns.moneylog.user.domain.User;
import org.juns.moneylog.user.repository.UserRepository;
import org.juns.moneylog.user.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final JwtTokenizer jwtTokenizer;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthTokenResponse issueToken(User user){
        return AuthTokenResponse.from(jwtTokenizer.createAccessToken(user), refreshTokenService.issueRefreshToken(user));
    }

    @Transactional
    public AuthTokenResponse reissueRefreshToken(String refreshToken){
        RotatedToken rotateRefreshToken = refreshTokenService.rotateRefreshToken(refreshToken);
        return AuthTokenResponse.from(jwtTokenizer.createAccessToken(rotateRefreshToken.user()), rotateRefreshToken.value());
    }

    @Transactional
    public void logoutRefreshToken(String refreshToken){
        refreshTokenService.revokeRefreshToken(refreshToken);
    }


    public User authenticateLocal(
            String email,
            String rawPassword
    ) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("Invalid email"));

        if (!user.isEnabled()
                || user.getPasswordHash() == null
                || !passwordEncoder.matches(
                rawPassword,
                user.getPasswordHash()
        )) {
            throw new IllegalArgumentException("Invalid email");
        }

        return user;
    }

    @Transactional
    public AuthTokenResponse login(LoginRequest request) {
        User user = authenticateLocal(
                request.email(),
                request.password()
        );

        return issueToken(user);
    }

    @Transactional
    public void logout(String refreshToken){
        refreshTokenService.revokeRefreshToken(refreshToken);
    }

}