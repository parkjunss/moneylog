package org.juns.moneylog.moneylog.service;

import lombok.RequiredArgsConstructor;
import org.juns.moneylog.category.domain.Category;
import org.juns.moneylog.category.repository.CategoryRepository;
import org.juns.moneylog.config.enums.CategoryName;
import org.juns.moneylog.config.enums.CategoryType;
import org.juns.moneylog.moneylog.domain.MoneyLog;
import org.juns.moneylog.moneylog.dto.*;
import org.juns.moneylog.moneylog.repository.MoneyLogRepository;
import org.juns.moneylog.user.domain.User;
import org.juns.moneylog.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.Year;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MoneyLogService {

    private final MoneyLogRepository moneyLogRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public MoneyLogResponse createLog(MoneyLogRequest moneyLogRequest, String email) {

        User user = userRepository.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException(email));
        Category category = categoryRepository.findByCategoryName(CategoryName.valueOf(moneyLogRequest.category())).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        MoneyLog moneyLog = MoneyLog.builder()
                .createdBy(user)
                .title(moneyLogRequest.title())
                .description(moneyLogRequest.description())
                .money(moneyLogRequest.money())
                .category(category)
                .type(category.getType())
                .build();
        moneyLogRepository.save(moneyLog);

        return MoneyLogResponse.from(moneyLog);
    }

    public MoneyLogResponse getLog(Long id, String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException(email));
        MoneyLog moneyLog = moneyLogRepository.findByIdAndCreatedBy(id, user).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "MoneyLog not found"));
        return MoneyLogResponse.from(moneyLog);
    }


    @Transactional
    public MoneyLogResponse updateLog(Long id, MoneylogUpdateRequest request, String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException(email));
        MoneyLog log = moneyLogRepository.findByIdAndCreatedBy(id, user)
                .orElseThrow(() ->
                new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "MoneyLog not found."
                )
        );;
        CategoryName categoryName;

        try {
            categoryName = CategoryName.valueOf(request.category());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Wrong category type."
            );
        }

        Category category = categoryRepository
                .findByCategoryName(categoryName)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Category not found"
                        )
                );

        log.update(
                request.title(),
                request.description(),
                request.money(),
                category
        );

        return MoneyLogResponse.from(log);

    }

    @Transactional
    public void deleteLog(Long id, String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException(email));
        MoneyLog log = moneyLogRepository.findByIdAndCreatedBy(id, user).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "MoneyLog not found"));
        moneyLogRepository.delete(log);
    }


    @Transactional(readOnly = true)
    public MonthlyStatisticsResponse getMonthlyStatistics(
            String email,
            int year,
            int month
    ) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));

        YearMonth yearMonth = YearMonth.of(year, month);

        LocalDateTime start = yearMonth
                .atDay(1)
                .atStartOfDay();

        LocalDateTime end = yearMonth
                .plusMonths(1)
                .atDay(1)
                .atStartOfDay();

        List<MoneyLog> logs =
                moneyLogRepository
                        .findAllByCreatedByAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                                user,
                                start,
                                end
                        );

        long totalIncome = logs.stream()
                .filter(log -> log.getType() == CategoryType.INCOME)
                .mapToLong(MoneyLog::getMoney)
                .sum();

        long totalExpense = logs.stream()
                .filter(log -> log.getType() == CategoryType.EXPENSE)
                .mapToLong(MoneyLog::getMoney)
                .sum();

        Map<Category, Long> expenseByCategory = logs.stream()
                .filter(log -> log.getType() == CategoryType.EXPENSE)
                .collect(Collectors.groupingBy(
                        MoneyLog::getCategory,
                        Collectors.summingLong(MoneyLog::getMoney)
                ));

        List<CategoryExpenseResponse> categoryExpenses =
                expenseByCategory.entrySet().stream()
                        .map(entry -> CategoryExpenseResponse.builder()
                                .categoryId(entry.getKey().getId())
                                .categoryName(entry.getKey().getCategoryName().name())
                                .amount(entry.getValue())
                                .build())
                        .sorted(Comparator.comparingLong(
                                CategoryExpenseResponse::getAmount
                        ).reversed())
                        .toList();

        return MonthlyStatisticsResponse.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .balance(totalIncome - totalExpense)
                .categoryExpenses(categoryExpenses)
                .build();
    }


    public Page<MoneyLogResponse> getMoneyLogs(
            String email,
            Integer year,
            Integer month,
            CategoryType categoryType,
            Long categoryId,
            Pageable pageable
    ){
        User user = userRepository.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException(email));
        return moneyLogRepository
                .searchMoneyLog(user, year, month, categoryType, categoryId, pageable)
                .map(MoneyLogResponse::from);
    }

}
