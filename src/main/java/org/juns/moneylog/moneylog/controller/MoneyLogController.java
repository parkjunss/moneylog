package org.juns.moneylog.moneylog.controller;

import lombok.RequiredArgsConstructor;
import org.juns.moneylog.moneylog.domain.MoneyLog;
import org.juns.moneylog.moneylog.dto.MoneyLogRequest;
import org.juns.moneylog.moneylog.dto.MoneyLogResponse;
import org.juns.moneylog.moneylog.dto.MoneylogUpdateRequest;
import org.juns.moneylog.moneylog.dto.MonthlyStatisticsResponse;
import org.juns.moneylog.moneylog.service.MoneyLogService;
import org.juns.moneylog.user.domain.User;
import org.juns.moneylog.user.repository.UserRepository;
import org.juns.moneylog.user.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/money-logs")
@RequiredArgsConstructor
public class MoneyLogController {
    private final MoneyLogService moneyLogService;

    @GetMapping
    public ResponseEntity<List<MoneyLogResponse>> getAllMoneyLog(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(moneyLogService.getAllLogs(email));
    }

    @PostMapping
    public ResponseEntity<MoneyLogResponse> addMoneyLog(@RequestBody MoneyLogRequest moneyLogRequest, Authentication authentication) {
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
    public ResponseEntity<MoneyLogResponse> updateMoneyLog(@PathVariable Long id, @RequestBody MoneylogUpdateRequest updateRequest, Authentication authentication) {
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
