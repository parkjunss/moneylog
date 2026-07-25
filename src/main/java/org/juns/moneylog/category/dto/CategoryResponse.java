package org.juns.moneylog.category.dto;

import lombok.Builder;
import org.juns.moneylog.category.domain.Category;

@Builder
public record CategoryResponse(
        Long id,
        String categoryName,
        String categoryType
) {

    public static CategoryResponse from(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .categoryName(category.getCategoryName().getDisplayName())
                .categoryType(category.getType().name())
                .build();
    }
}
