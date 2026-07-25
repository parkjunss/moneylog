package org.juns.moneylog.moneylog.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.juns.moneylog.config.enums.CategoryType;
import org.juns.moneylog.moneylog.dto.MoneyLogRequest;
import org.juns.moneylog.moneylog.dto.MoneyLogResponse;
import org.juns.moneylog.moneylog.dto.MoneylogUpdateRequest;
import org.juns.moneylog.moneylog.dto.MonthlyStatisticsResponse;
import org.juns.moneylog.moneylog.service.MoneyLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/money-logs")
@RequiredArgsConstructor
public class MoneyLogController {
    private final MoneyLogService moneyLogService;

    @GetMapping
    public ResponseEntity<Page<MoneyLogResponse>> getAllMoneyLog(
            Authentication authentication,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) @Min(1) @Max(12) Integer month,
            @RequestParam(required = false) CategoryType type,
            @RequestParam(required = false) Long categoryId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(
                moneyLogService.getMoneyLogs(email, year, month, type, categoryId, pageable)
        );
    }

    @PostMapping
    public ResponseEntity<MoneyLogResponse> addMoneyLog(@Valid @RequestBody MoneyLogRequest moneyLogRequest, Authentication authentication) {
        String email = authentication.getName();
        MoneyLogResponse response = moneyLogService.createLog(moneyLogRequest, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MoneyLogResponse> getMoneyLog(@PathVariable Long id, Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(moneyLogService.getLog(id, email));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<MoneyLogResponse> updateMoneyLog(@PathVariable Long id, @Valid @RequestBody MoneylogUpdateRequest updateRequest, Authentication authentication) {
        String email = authentication.getName();
        MoneyLogResponse response = moneyLogService.updateLog(id, updateRequest, email);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMoneyLog(@PathVariable Long id, Authentication authentication) {
        String email = authentication.getName();
        moneyLogService.deleteLog(id, email);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/monthly")
    public MonthlyStatisticsResponse getMonthlyStatistics(
            Authentication authentication,
            @RequestParam int year,
            @RequestParam int month
    ) {
        return moneyLogService.getMonthlyStatistics(
                authentication.getName(),
                year,
                month
        );
    }

}
