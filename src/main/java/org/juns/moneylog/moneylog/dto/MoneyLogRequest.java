package org.juns.moneylog.moneylog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record MoneyLogRequest(
        @NotBlank
        String title,

        @NotBlank
        String description,

        @NotNull
        @Positive
        Long money,

        @NotBlank
        String date,

        @NotBlank
        String category
) {
}
