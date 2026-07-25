package org.juns.moneylog.moneylog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class MonthlyStatisticsResponse {

    private Long totalIncome;
    private Long totalExpense;
    private Long balance;

    private List<CategoryExpenseResponse> categoryExpenses;
}