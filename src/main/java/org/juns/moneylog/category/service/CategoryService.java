package org.juns.moneylog.category.service;

import lombok.RequiredArgsConstructor;
import org.juns.moneylog.category.domain.Category;
import org.juns.moneylog.category.dto.CategoryRequest;
import org.juns.moneylog.category.dto.CategoryResponse;
import org.juns.moneylog.category.repository.CategoryRepository;
import org.juns.moneylog.config.enums.CategoryName;
import org.juns.moneylog.config.enums.CategoryType;
import org.juns.moneylog.config.enums.RoleType;
import org.juns.moneylog.config.exception.CategoryNotFoundException;
import org.juns.moneylog.config.exception.UserNotFoundException;
import org.juns.moneylog.user.domain.User;
import org.juns.moneylog.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
    public CategoryResponse addCategory(CategoryRequest categoryRequest, String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new UserNotFoundException("User not found"));
        boolean isAdmin = user.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals(RoleType.ROLE_ADMIN.name()));

        if(!isAdmin){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed");
        }

        String categoryName = categoryRequest.categoryName();
        String categoryType = categoryRequest.categoryType();

        if(categoryRepository.existsByCategoryName(CategoryName.fromValue(categoryName))){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category name already exists");
        }

        Category category = categoryRepository.save(Category.builder()
                .categoryName(CategoryName.fromValue(categoryName))
                .type(CategoryType.fromValue(categoryType))
                .build());

        return CategoryResponse.from(category);
    }

    @Transactional
    public void deleteCategory(Long id, String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new UserNotFoundException("User not found"));
        boolean isAdmin = user.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals(RoleType.ROLE_ADMIN.name()));
        if(!isAdmin){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed");
        }

        Category category = categoryRepository.findById(id).orElseThrow(() -> new CategoryNotFoundException("Category not found"));
        categoryRepository.delete(category);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest categoryRequest, String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new UserNotFoundException("User not found"));

        boolean isAdmin = user.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals(RoleType.ROLE_ADMIN.name()));
        if(!isAdmin){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed");
        }

        Category category = categoryRepository.findById(id).orElseThrow(() -> new CategoryNotFoundException("Category not found"));
        CategoryName categoryName = CategoryName.fromValue(categoryRequest.categoryName());
        CategoryType categoryType = CategoryType.fromValue(categoryRequest.categoryType());
        category.updateCategory(categoryName, categoryType);
        return CategoryResponse.from(category);

    }
}
