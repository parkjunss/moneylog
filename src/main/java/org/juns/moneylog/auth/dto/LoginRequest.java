package org.juns.moneylog.auth.dto;

public record LoginRequest(
        String email,
        String password
) {
}
