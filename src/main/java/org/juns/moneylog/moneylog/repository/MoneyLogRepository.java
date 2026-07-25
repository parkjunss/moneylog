package org.juns.moneylog.moneylog.repository;

import org.juns.moneylog.category.domain.Category;
import org.juns.moneylog.config.enums.CategoryType;
import org.juns.moneylog.moneylog.domain.MoneyLog;
import org.juns.moneylog.moneylog.dto.CategoryExpenseProjection;
import org.juns.moneylog.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.time.Month;
import java.util.List;
import java.util.Optional;

public interface MoneyLogRepository extends JpaRepository<MoneyLog, Long> {
    List<MoneyLog> findByCategory(Category category);
    List<MoneyLog> findByCreatedBy(User user);
    Optional<MoneyLog> findByIdAndCreatedBy(Long id, User user);

    List<MoneyLog> findAllByCreatedByAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            User createdBy,
            LocalDateTime start,
            LocalDateTime end
    );


    @Query("""
    select coalesce(sum(m.money), 0)
    from MoneyLog m
    where m.createdBy = :user
      and m.type = :type
      and m.createdAt >= :start
      and m.createdAt < :end
    """)
    Long sumMoneyByUserAndTypeAndPeriod(
            @Param("user") User user,
            @Param("type") CategoryType type,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );


    @Query("""
    select new org.juns.moneylog.moneylog.dto.CategoryExpenseProjection(
        c.id,
        c.categoryName,
        sum(m.money)
    )
    from MoneyLog m
    join m.category c
    where m.createdBy = :user
      and m.type = org.juns.moneylog.config.enums.CategoryType.EXPENSE
      and m.createdAt >= :start
      and m.createdAt < :end
    group by c.id, c.categoryName
    order by sum(m.money) desc
    """)
    List<CategoryExpenseProjection> findCategoryExpenseStatistics(
            @Param("user") User user,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

}
