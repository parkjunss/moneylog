package org.juns.moneylog.moneylog.dto;

import org.juns.moneylog.config.enums.CategoryName;

public record CategoryExpenseProjection(
        Long categoryId,
        CategoryName categoryName,
        Long amount
) {
}