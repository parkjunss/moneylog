package org.juns.moneylog.user.dto;

import jakarta.validation.constraints.NotBlank;

public record UserUpdateRequest(
        @NotBlank
        String username
) {
}
