package org.juns.moneylog.config.security;

import org.juns.moneylog.config.enums.RoleType;
import org.juns.moneylog.user.domain.Role;
import org.juns.moneylog.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtTokenizerTest {

    private JwtTokenizer jwtTokenizer;
    private JwtDecoder jwtDecoder;
    private JwtEncoder jwtEncoder;

    @BeforeEach
    void setUp() {
        JwtConfig jwtConfig = new JwtConfig();
        SecretKey secretKey = jwtConfig.jwtSecretKey("moneylog-test-secret-key-32-bytes!");

        jwtEncoder = jwtConfig.jwtEncoder(secretKey);
        jwtTokenizer = new JwtTokenizer(jwtEncoder);
        jwtDecoder = jwtConfig.jwtDecoder(secretKey);
        ReflectionTestUtils.setField(jwtTokenizer, "accessTokenExpirations", 60_000L);
    }

    @Test
    void createAccessToken_containsUserAndRoleClaims() {
        User user = User.builder()
                .id(42L)
                .email("user@example.com")
                .roles(Set.of(Role.builder().name(RoleType.ROLE_USER).build()))
                .build();

        Jwt jwt = jwtDecoder.decode(jwtTokenizer.createAccessToken(user));

        assertEquals("moneylog", jwt.getClaimAsString("iss"));
        assertEquals("user@example.com", jwt.getSubject());
        assertEquals(List.of("ROLE_USER"), jwt.getClaimAsStringList("roles"));
        assertTrue(jwt.getExpiresAt().isAfter(jwt.getIssuedAt()));
    }

    @Test
    void decoder_rejectsTamperedToken() {
        User user = User.builder().id(42L).email("user@example.com").roles(Set.of()).build();
        String[] parts = jwtTokenizer.createAccessToken(user).split("\\.");
        parts[2] = (parts[2].charAt(0) == 'A' ? "B" : "A") + parts[2].substring(1);

        assertThrows(JwtException.class, () -> jwtDecoder.decode(String.join(".", parts)));
    }

    @Test
    void decoder_rejectsExpiredToken() {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuedAt(now.minusSeconds(300))
                .expiresAt(now.minusSeconds(120))
                .subject("42")
                .build();
        String expiredToken = jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(),
                claims
        )).getTokenValue();

        assertThrows(JwtException.class, () -> jwtDecoder.decode(expiredToken));
    }
}
