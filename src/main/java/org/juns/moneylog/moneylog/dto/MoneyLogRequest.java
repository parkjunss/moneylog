package org.juns.moneylog.moneylog.dto;

public record MoneyLogRequest(
        String username,
        String title,
        String description,
        Long money,
        String date,
        String category
) {
}
