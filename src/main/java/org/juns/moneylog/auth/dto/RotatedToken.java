package org.juns.moneylog.auth.dto;

import org.juns.moneylog.user.domain.User;

public record RotatedToken(
        User user,
        String value
) {
}