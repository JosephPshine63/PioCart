package dev.pioruocco.piocart.controller;

import dev.pioruocco.piocart.model.Category;
import dev.pioruocco.piocart.response.ApiResponse;
import dev.pioruocco.piocart.service.category.ICategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("${api.prefix}/categories")
public class CategoryController {
    private final ICategoryService categoryService;

    @GetMapping("/all")
    public ResponseEntity<ApiResponse> getAllCategories() {
        List<Category> categories = categoryService.getAllCategories();
        return  ResponseEntity.ok(new ApiResponse("Found!", categories));
    }

    @PostMapping("/add")
    public ResponseEntity<ApiResponse> addCategory(@RequestBody Category name) {
        Category theCategory = categoryService.addCategory(name);
        return  ResponseEntity.ok(new ApiResponse("Success", theCategory));
    }

    @GetMapping("/category/{id}/category")
    public ResponseEntity<ApiResponse> getCategoryById(@PathVariable Long id){
        Category theCategory = categoryService.getCategoryById(id);
        return  ResponseEntity.ok(new ApiResponse("Found", theCategory));
    }

    @GetMapping("/category/by-name/{name}")
    public ResponseEntity<ApiResponse> getCategoryByName(@PathVariable String name){
        Category theCategory = categoryService.getCategoryByName(name);
        return  ResponseEntity.ok(new ApiResponse("Found", theCategory));
    }


    @DeleteMapping("/category/{id}/delete")
    public ResponseEntity<ApiResponse> deleteCategory(@PathVariable Long id){
        categoryService.deleteCategoryById(id);
        return  ResponseEntity.ok(new ApiResponse("Delete success!", null));
    }

    @PutMapping("/category/{id}/update")
    public ResponseEntity<ApiResponse> updateCategory(@PathVariable Long id, @RequestBody Category category) {
        Category updatedCategory = categoryService.updateCategory(category, id);
        return ResponseEntity.ok(new ApiResponse("Update success!", updatedCategory));
    }

}
