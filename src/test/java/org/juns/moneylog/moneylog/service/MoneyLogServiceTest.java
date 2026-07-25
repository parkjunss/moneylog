package org.juns.moneylog.moneylog.service;

import org.juns.moneylog.category.domain.Category;
import org.juns.moneylog.category.repository.CategoryRepository;
import org.juns.moneylog.config.enums.CategoryName;
import org.juns.moneylog.config.enums.CategoryType;
import org.juns.moneylog.moneylog.domain.MoneyLog;
import org.juns.moneylog.moneylog.dto.MoneyLogRequest;
import org.juns.moneylog.moneylog.dto.MoneyLogResponse;
import org.juns.moneylog.moneylog.dto.MoneylogUpdateRequest;
import org.juns.moneylog.moneylog.repository.MoneyLogRepository;
import org.juns.moneylog.user.domain.User;
import org.juns.moneylog.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MoneyLogServiceTest {

    @Mock
    private MoneyLogRepository moneyLogRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private MoneyLogService moneyLogService;

    @Test
    void updateLog_updatesOwnedLogAndCategoryType() {
        String email = "user@example.com";
        User user = User.builder().email(email).username("juns").build();
        Category oldCategory = Category.builder()
                .categoryName(CategoryName.FOOD)
                .type(CategoryType.EXPENSE)
                .build();
        Category newCategory = Category.builder()
                .categoryName(CategoryName.SALARY)
                .type(CategoryType.INCOME)
                .build();
        MoneyLog log = MoneyLog.builder()
                .id(1L)
                .title("점심")
                .description("식사")
                .money(10_000L)
                .createdAt(LocalDateTime.of(2026, 7, 24, 12, 0))
                .type(CategoryType.EXPENSE)
                .createdBy(user)
                .category(oldCategory)
                .build();
        MoneylogUpdateRequest request =
                new MoneylogUpdateRequest("월급", "7월 급여", 3_000_000L, "2026-07-24", "SALARY", "INCOME");

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(moneyLogRepository.findByIdAndCreatedBy(1L, user)).thenReturn(Optional.ofNullable(log));
        when(categoryRepository.findByCategoryName(CategoryName.SALARY)).thenReturn(Optional.of(newCategory));

        MoneyLogResponse response = moneyLogService.updateLog(1L, request, email);

        assertAll(
                () -> assertEquals("월급", response.title()),
                () -> assertEquals("7월 급여", response.description()),
                () -> assertEquals("3000000", response.money()),
                () -> assertEquals("SALARY", response.category()),
                () -> assertEquals(CategoryType.INCOME, Objects.requireNonNull(log).getType())
        );
    }

    @Test
    void updateLog_rejectsUnknownCategoryBeforeRepositoryLookup() {
        String email = "user@example.com";
        User user = User.builder().email(email).username("juns").build();
        MoneylogUpdateRequest request =
                new MoneylogUpdateRequest("제목", "설명", 1_000L, "2026-07-24", "UNKNOWN", "EXPENSE");

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(moneyLogRepository.findByIdAndCreatedBy(1L, user)).thenReturn(Optional.ofNullable(MoneyLog.builder().build()));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> moneyLogService.updateLog(1L, request, email)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verify(categoryRepository, never()).findByCategoryName(org.mockito.ArgumentMatchers.any());
    }
}
