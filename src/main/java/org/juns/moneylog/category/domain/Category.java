package org.juns.moneylog.category.domain;

import jakarta.persistence.*;
import lombok.*;
import org.juns.moneylog.category.dto.CategoryRequest;
import org.juns.moneylog.config.enums.CategoryName;
import org.juns.moneylog.config.enums.CategoryType;
import org.juns.moneylog.user.domain.User;
import org.springframework.security.core.Authentication;

@Entity
@Table(name = "categories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private CategoryName categoryName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoryType type;

    public void updateCategory(CategoryName categoryName, CategoryType categoryType) {
        this.categoryName = categoryName;
        this.type = categoryType;
    }
}
