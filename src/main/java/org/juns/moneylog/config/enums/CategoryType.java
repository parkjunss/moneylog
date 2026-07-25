package org.juns.moneylog.config.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum CategoryType {
    INCOME("수입"),
    EXPENSE("지출");

    private final String typeName;

    public static CategoryType fromValue(String value) {
        return Arrays.stream(values())
                .filter(t -> t.typeName.equalsIgnoreCase(value) || t.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("일치하는 Enum 객체가 없습니다: " + value));
    }
}