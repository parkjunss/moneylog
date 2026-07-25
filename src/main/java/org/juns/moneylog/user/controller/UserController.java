package org.juns.moneylog.user.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.juns.moneylog.auth.dto.LoginRequest;
import org.juns.moneylog.user.dto.UserResponse;
import org.juns.moneylog.user.dto.UserUpdateRequest;
import org.juns.moneylog.user.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User API")
public class UserController {
    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getUserProfile(Authentication authentication) {
        String email = authentication.getName();
        UserResponse userResponse = userService.getUserByEmail(email);
        return ResponseEntity.ok(userResponse);
    }

    @PatchMapping("/profile")
    public ResponseEntity<UserResponse> updateUserProfile(Authentication authentication, @RequestBody UserUpdateRequest userUpdateRequest) {
        String email = authentication.getName();
        userService.updateUser(email, userUpdateRequest);
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    @DeleteMapping("/profile")
    public ResponseEntity<Void> deleteUser(Authentication authentication) {
        String email = authentication.getName();
        userService.deleteUser(email);
        return ResponseEntity.noContent().build();
    }


}
