package org.juns.moneylog.user.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
        @NotNull
        @Size(min = 5, max = 50)
        String username,
        @NotNull
        @Size(min = 10, max = 50)
        String email,
        @NotNull
        @Size(min = 10, max = 100)
        String password
) {
}
