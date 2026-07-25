package org.juns.moneylog.category.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.juns.moneylog.category.dto.CategoryRequest;
import org.juns.moneylog.category.dto.CategoryResponse;
import org.juns.moneylog.category.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/category")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping("/all")
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> getCategory(Authentication authentication, @Valid @RequestBody CategoryRequest categoryRequest) {
        String email = authentication.getName();
        CategoryResponse categoryResponse = categoryService.addCategory(categoryRequest, email);
        return ResponseEntity.ok(categoryResponse);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest categoryRequest, Authentication authentication) {
        String email = authentication.getName();
        CategoryResponse response = categoryService.updateCategory(id, categoryRequest, email);
        return ResponseEntity.ok(response);

    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> updateCategory(@PathVariable Long id, Authentication authentication) {
        String email = authentication.getName();
        categoryService.deleteCategory(id, email);
        return ResponseEntity.noContent().build();
    }
}
