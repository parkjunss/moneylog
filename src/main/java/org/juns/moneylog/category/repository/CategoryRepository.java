package org.juns.moneylog.category.repository;

import org.juns.moneylog.category.domain.Category;
import org.juns.moneylog.config.enums.CategoryName;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByCategoryName(CategoryName categoryName);
    boolean existsByCategoryName(CategoryName categoryName);

    Category getCategoryByCategoryName(CategoryName categoryName);
}
