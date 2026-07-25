package org.juns.moneylog.config.security;

import lombok.RequiredArgsConstructor;
import org.juns.moneylog.user.domain.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@RequiredArgsConstructor
public class JwtTokenizer {

    private final JwtEncoder jwtEncoder;

    @Value("${app.jwt.access-token-expiration-ms}")
    private long accessTokenExpirations;

    public String createAccessToken(User user) {
        Instant issuedAt = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("moneylog")
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plusMillis(accessTokenExpirations))
                .subject(user.getEmail())
                .claim("roles", user.getAuthorities().stream().map(SimpleGrantedAuthority::getAuthority).toList())
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();

        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();


    }
}
