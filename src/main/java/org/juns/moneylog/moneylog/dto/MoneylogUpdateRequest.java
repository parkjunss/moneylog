package org.juns.moneylog.moneylog.dto;

public record MoneylogUpdateRequest(
        String title,
        String description,
        Long money,
        String date,
        String category
) {
}
