package org.juns.moneylog.config.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.juns.moneylog.config.exception.CategoryNotSupportedException;

import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum CategoryName {

    FOOD("식비", CategoryType.EXPENSE),
    TRANSPORTATION("교통", CategoryType.EXPENSE),
    HOUSING("주거", CategoryType.EXPENSE),
    UTILITIES("공과금", CategoryType.EXPENSE),
    SHOPPING("쇼핑", CategoryType.EXPENSE),
    CULTURE("문화·여가", CategoryType.EXPENSE),
    HEALTH("의료·건강", CategoryType.EXPENSE),
    EDUCATION("교육", CategoryType.EXPENSE),
    COMMUNICATION("통신", CategoryType.EXPENSE),
    INSURANCE("보험", CategoryType.EXPENSE),
    SAVINGS("저축", CategoryType.EXPENSE),
    ETC_EXPENSE("기타 지출", CategoryType.EXPENSE),

    SALARY("급여", CategoryType.INCOME),
    ALLOWANCE("용돈", CategoryType.INCOME),
    BONUS("상여금", CategoryType.INCOME),
    INVESTMENT("투자 수익", CategoryType.INCOME),
    SIDE_INCOME("부수입", CategoryType.INCOME),
    ETC_INCOME("기타 수입", CategoryType.INCOME);

    private final String displayName;
    private final CategoryType type;


    // 💡 값을 받아 일치하는 Enum 객체 반환
    public static CategoryName fromValue(String value) {
        return Arrays.stream(values())
                .filter(t -> t.displayName.equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new CategoryNotSupportedException("일치하는 Enum 객체가 없습니다: " + value));
    }
}