package dev.pioruocco.piocart.service.category;

import dev.pioruocco.piocart.exceptions.AlreadyExistsException;
import dev.pioruocco.piocart.exceptions.ResourceInUseException;
import dev.pioruocco.piocart.exceptions.ResourceNotFoundException;
import dev.pioruocco.piocart.model.Category;
import dev.pioruocco.piocart.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CategoryService implements ICategoryService {
    private final CategoryRepository categoryRepository;
    
    @Override
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(()-> new ResourceNotFoundException("Category not found!"));
    }

    @Override
    public Category getCategoryByName(String name) {
        return Optional.ofNullable(categoryRepository.findByName(name))
                .orElseThrow(()-> new ResourceNotFoundException("Category not found!"));
    }

    @Override
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Override
    public Category addCategory(Category category) {
        String name = validName(category.getName());
        if (categoryRepository.existsByName(name)) {
            throw new AlreadyExistsException(name + " already exists");
        }
        return categoryRepository.save(new Category(name));
    }

    @Override
    public Category updateCategory(Category category, Long id) {
        Category oldCategory = getCategoryById(id);
        String name = validName(category.getName());
        Category sameName = categoryRepository.findByName(name);
        if (sameName != null && !sameName.getId().equals(id)) {
            throw new AlreadyExistsException(name + " already exists");
        }
        oldCategory.setName(name);
        return categoryRepository.save(oldCategory);
    }

    @Transactional
    @Override
    public void deleteCategoryById(Long id) {
        Category category = getCategoryById(id);
        if (!category.getProducts().isEmpty()) {
            throw new ResourceInUseException("The category still has products: move or delete them first");
        }
        categoryRepository.delete(category);
    }

    private String validName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("The category name is required");
        }
        if (name.trim().length() > 255) {
            throw new IllegalArgumentException("The category name is too long");
        }
        return name.trim();
    }
}
