package org.juns.moneylog.user.dto;

import org.juns.moneylog.user.domain.User;


public record UserResponse(
        String username,
        String email
) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getUsername(), user.getEmail());
    }
}
