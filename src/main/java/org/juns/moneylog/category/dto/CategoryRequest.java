package org.juns.moneylog.category.dto;

import jakarta.validation.constraints.NotBlank;

public record CategoryRequest(
        @NotBlank
        String categoryName,
        @NotBlank
        String categoryType
) {
}
