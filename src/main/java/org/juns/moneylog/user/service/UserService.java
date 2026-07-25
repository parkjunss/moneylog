package org.juns.moneylog.user.service;

import lombok.RequiredArgsConstructor;
import org.juns.moneylog.config.enums.RoleType;
import org.juns.moneylog.user.domain.Role;
import org.juns.moneylog.user.domain.User;
import org.juns.moneylog.user.dto.UserCreateRequest;
import org.juns.moneylog.user.dto.UserResponse;
import org.juns.moneylog.user.dto.UserUpdateRequest;
import org.juns.moneylog.user.repository.RoleRepository;
import org.juns.moneylog.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@Transactional(readOnly=true)
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse createUser(UserCreateRequest userCreateRequest) {
        if(userCreateRequest.email() == null || userCreateRequest.password() == null || userCreateRequest.username() == null) {
            throw new IllegalArgumentException("Email or password or username is null");
        }

        if(userRepository.findByEmail(userCreateRequest.email()).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }

        if(userRepository.findByUsername(userCreateRequest.username()).isPresent()) {
            throw new IllegalArgumentException("Username already exists");
        }

        Role role = roleRepository.findByName(RoleType.ROLE_USER).orElseThrow(() -> new IllegalArgumentException("Role not found"));
        Set<Role> roles = new HashSet<>();
        roles.add(role);

        User newUser = User.builder()
                .email(userCreateRequest.email())
                .username(userCreateRequest.username())
                .passwordHash(passwordEncoder.encode(userCreateRequest.password()))
                .roles(roles)
                .build();

        return UserResponse.from(newUser);
    }

    @Transactional
    public void deleteUser(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found"));
        userRepository.delete(user);
    }

    @Transactional
    public void updateUser(String email, UserUpdateRequest userUpdateRequest) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.updateUsername(userUpdateRequest.username());
        UserResponse.from(user);
    }


    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return UserResponse.from(user);
    }


}
