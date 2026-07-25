package org.juns.moneylog.category.service;

import lombok.RequiredArgsConstructor;
import org.juns.moneylog.category.domain.Category;
import org.juns.moneylog.category.dto.CategoryRequest;
import org.juns.moneylog.category.dto.CategoryResponse;
import org.juns.moneylog.category.repository.CategoryRepository;
import org.juns.moneylog.config.enums.CategoryName;
import org.juns.moneylog.config.enums.CategoryType;
import org.juns.moneylog.config.enums.RoleType;
import org.juns.moneylog.user.domain.Role;
import org.juns.moneylog.user.domain.User;
import org.juns.moneylog.user.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public List<CategoryResponse> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        return categories.stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @Transactional
    public CategoryResponse addCategory(CategoryRequest categoryRequest) {
        String categoryName = categoryRequest.categoryName();
        String categoryType = categoryRequest.categoryType();

        if(categoryRepository.existsByCategoryName(CategoryName.fromValue(categoryName))){
            throw new BadCredentialsException("Category already exists");
        }

        Category category = categoryRepository.save(Category.builder()
                .categoryName(CategoryName.fromValue(categoryName))
                .type(CategoryType.fromValue(categoryType))
                .build());

        return CategoryResponse.from(category);
    }

    @Transactional
    public void deleteCategory(String categoryName, String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new BadCredentialsException("User not found"));
        if(user.getAuthorities() ==  null || user.getAuthorities().isEmpty()){
            throw new BadCredentialsException("User not logged in");
        }

        Category category = categoryRepository.findByCategoryName(CategoryName.fromValue(categoryName)).orElseThrow(() -> new BadCredentialsException("Category not found"));
        categoryRepository.delete(category);
    }
}
