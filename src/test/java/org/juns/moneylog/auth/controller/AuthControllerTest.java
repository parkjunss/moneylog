package org.juns.moneylog.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.juns.moneylog.config.enums.RoleType;
import org.juns.moneylog.user.domain.User;
import org.juns.moneylog.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String PASSWORD = "password123!";

    private String uniqueEmail() {
        return "authtest" + System.nanoTime() + "@example.com";
    }

    private void signUp(String email) throws Exception {
        String body = objectMapper.writeValueAsString(new SignUpBody("authtester", email, PASSWORD));

        mockMvc.perform(post("/api/auth/signup")
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isCreated());
    }

    private MvcResult login(String email, String password) throws Exception {
        String body = objectMapper.writeValueAsString(new LoginBody(email, password));

        return mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(body))
                .andReturn();
    }

    @Test
    void signup_savesLocalUserWithRoleUser() throws Exception {
        String email = uniqueEmail();

        signUp(email);

        Optional<User> saved = userRepository.findByEmail(email);
        assertTrue(saved.isPresent(), "회원가입한 사용자가 DB에 저장되어 있어야 한다");
        assertTrue(
                saved.get().getAuthorities().stream()
                        .anyMatch(authority -> authority.getAuthority().equals(RoleType.ROLE_USER.name())),
                "ROLE_USER 권한이 부여되어 있어야 한다"
        );
    }

    @Test
    void login_withCorrectPassword_issuesDifferentAccessAndRefreshTokens() throws Exception {
        String email = uniqueEmail();
        signUp(email);

        MvcResult result = login(email, PASSWORD);
        result.getResponse().setCharacterEncoding("UTF-8");

        String accessToken = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken").asText();
        Cookie refreshCookie = result.getResponse().getCookie("refreshToken");

        assertEquals(200, result.getResponse().getStatus());
        assertNotNull(accessToken);
        assertNotNull(refreshCookie);
        assertNotNull(refreshCookie.getValue());
        assertNotEquals(accessToken, refreshCookie.getValue());
    }

    @Test
    void login_withWrongPassword_returns401() throws Exception {
        String email = uniqueEmail();
        signUp(email);

        String body = objectMapper.writeValueAsString(new LoginBody(email, "wrong-password!"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", notNullValue()));
    }

    @Test
    void login_withUnknownEmail_returns401() throws Exception {
        String body = objectMapper.writeValueAsString(new LoginBody("no-such-user@example.com", PASSWORD));

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void reissue_withValidRefreshToken_rotatesToken() throws Exception {
        String email = uniqueEmail();
        signUp(email);
        MvcResult loginResult = login(email, PASSWORD);
        Cookie refreshCookie = loginResult.getResponse().getCookie("refreshToken");

        MvcResult reissueResult = mockMvc.perform(post("/api/auth/reissue")
                        .cookie(refreshCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andReturn();

        Cookie rotatedCookie = reissueResult.getResponse().getCookie("refreshToken");
        assertNotNull(rotatedCookie);
        assertNotEquals(refreshCookie.getValue(), rotatedCookie.getValue());
    }

    @Test
    void reissue_withAlreadyRotatedRefreshToken_returns401() throws Exception {
        String email = uniqueEmail();
        signUp(email);
        MvcResult loginResult = login(email, PASSWORD);
        Cookie originalRefreshCookie = loginResult.getResponse().getCookie("refreshToken");

        // 첫 번째 재발급 — 정상적으로 새 refresh token으로 교체됨
        mockMvc.perform(post("/api/auth/reissue").cookie(originalRefreshCookie))
                .andExpect(status().isOk());

        // 이미 교체되어 무효화된 이전 refresh token을 다시 사용 시도 -> 401
        mockMvc.perform(post("/api/auth/reissue").cookie(originalRefreshCookie))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logout_thenReissue_returns401() throws Exception {
        String email = uniqueEmail();
        signUp(email);
        MvcResult loginResult = login(email, PASSWORD);
        Cookie refreshCookie = loginResult.getResponse().getCookie("refreshToken");

        mockMvc.perform(post("/api/auth/logout").cookie(refreshCookie))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/auth/reissue").cookie(refreshCookie))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpoint_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/users/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpoint_withValidToken_returns200() throws Exception {
        String email = uniqueEmail();
        signUp(email);
        MvcResult loginResult = login(email, PASSWORD);
        String accessToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        mockMvc.perform(get("/api/users/profile")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", notNullValue()));
    }

    private record SignUpBody(String username, String email, String password) {
    }

    private record LoginBody(String email, String password) {
    }
}
