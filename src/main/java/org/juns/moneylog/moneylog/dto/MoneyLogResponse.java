package org.juns.moneylog.moneylog.dto;

import lombok.Builder;
import org.juns.moneylog.moneylog.domain.MoneyLog;

@Builder
public record MoneyLogResponse(
        String username,
        String title,
        String description,
        String money,
        String date,
        String category
) {

    public static MoneyLogResponse from(MoneyLog moneyLog) {
        return MoneyLogResponse.builder()
                .username(moneyLog.getCreatedBy().getUsername())
                .title(moneyLog.getTitle())
                .description(moneyLog.getDescription())
                .money(moneyLog.getMoney().toString())
                .date(moneyLog.getCreatedAt().toString())
                .category(moneyLog.getCategory().getCategoryName().toString())
                .build();
    }

}
