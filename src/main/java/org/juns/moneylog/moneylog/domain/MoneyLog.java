package org.juns.moneylog.moneylog.domain;

import jakarta.persistence.*;
import lombok.*;
import org.juns.moneylog.category.domain.Category;
import org.juns.moneylog.config.enums.CategoryType;
import org.juns.moneylog.user.domain.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "money_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MoneyLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String title;

    @Column(nullable = false, length = 100)
    private String description;

    @Column(nullable = false)
    private Long money;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoryType type;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;


    public void update(
            String title,
            String description,
            Long money,
            Category category
    ) {
        this.title = title;
        this.description = description;
        this.money = money;
        this.category = category;
        this.type = category.getType();
    }

}
