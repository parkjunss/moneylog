package org.juns.moneylog.auth.dto;

import lombok.Builder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;

@Builder
public record AuthTokenResponse(
        String accessToken,
        String refreshToken
) {

    public static AuthTokenResponse from(String accessToken, String refreshToken) {
        return AuthTokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }
}
