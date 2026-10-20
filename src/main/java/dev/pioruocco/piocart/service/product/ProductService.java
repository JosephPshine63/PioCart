package dev.pioruocco.piocart.service.product;

import dev.pioruocco.piocart.dto.ImageDto;
import dev.pioruocco.piocart.dto.ProductDto;
import dev.pioruocco.piocart.exceptions.ResourceInUseException;
import dev.pioruocco.piocart.exceptions.ResourceNotFoundException;
import dev.pioruocco.piocart.model.Category;
import dev.pioruocco.piocart.model.Image;
import dev.pioruocco.piocart.model.Product;
import dev.pioruocco.piocart.repository.CartItemRepository;
import dev.pioruocco.piocart.repository.CategoryRepository;
import dev.pioruocco.piocart.repository.ImageRepository;
import dev.pioruocco.piocart.repository.OrderItemRepository;
import dev.pioruocco.piocart.repository.ProductRepository;
import dev.pioruocco.piocart.repository.ProductSpecifications;
import dev.pioruocco.piocart.request.AddProductRequest;
import dev.pioruocco.piocart.request.ProductUpdateRequest;
import dev.pioruocco.piocart.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductService implements IProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ModelMapper modelMapper;
    private final ImageRepository imageRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;

    @Override
    public Product addProduct(AddProductRequest request) {
        // check if the category is found in the DB
        // If Yes, set it as the new product category
        // If No, the save it as a new category
        // The set as the new product category.

        Category category = findOrCreateCategory(request.getCategory().getName());
        return productRepository.save(createProduct(request, category));
    }

    private Category findOrCreateCategory(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("The category name is required");
        }
        String trimmed = name.trim();
        return Optional.ofNullable(categoryRepository.findByName(trimmed))
                .orElseGet(() -> categoryRepository.save(new Category(trimmed)));
    }

    private Product createProduct(AddProductRequest request, Category category) {
        return new Product(
                request.getName(),
                request.getBrand(),
                request.getPrice(),
                request.getInventory(),
                request.getDescription(),
                category
        );
    }


    @Override
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(()-> new ResourceNotFoundException("Product not found!"));
    }

    // Ordered products stay, so past orders keep their lines: they can be taken off sale by setting the stock to 0
    @Transactional
    @Override
    public void deleteProductById(Long id) {
        Product product = getProductById(id);
        if (orderItemRepository.existsByProductId(id)) {
            throw new ResourceInUseException("The product has been ordered and can't be deleted: set its stock to 0 instead");
        }
        // through Cart.removeItem, so the carts' totals stay right
        cartItemRepository.findByProductId(id).forEach(item -> item.getCart().removeItem(item));
        productRepository.delete(product);
    }

    @Override
    public Product updateProduct(ProductUpdateRequest request, Long productId) {
        return productRepository.findById(productId)
                .map(existingProduct -> updateExistingProduct(existingProduct,request))
                .map(productRepository :: save)
                .orElseThrow(()-> new ResourceNotFoundException("Product not found!"));
    }

    private Product updateExistingProduct(Product existingProduct, ProductUpdateRequest request) {
        existingProduct.setName(request.getName());
        existingProduct.setBrand(request.getBrand());
        existingProduct.setPrice(request.getPrice());
        existingProduct.setInventory(request.getInventory());
        existingProduct.setDescription(request.getDescription());

        Category category = findOrCreateCategory(request.getCategory().getName());
        existingProduct.setCategory(category);
        return  existingProduct;

    }

    @Override
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Override
    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategoryName(category);
    }

    @Override
    public List<Product> getProductsByBrand(String brand) {
        return productRepository.findByBrand(brand);
    }

    @Override
    public List<Product> getProductsByCategoryAndBrand(String category, String brand) {
        return productRepository.findByCategoryNameAndBrand(category, brand);
    }

    @Override
    public List<Product> getProductsByName(String name) {
        return productRepository.findByName(name);
    }

    @Override
    public List<Product> getProductsByBrandAndName(String brand, String name) {
        return productRepository.findByBrandAndName(brand, name);
    }

    @Override
    public Long countProductsByBrandAndName(String brand, String name) {
        return productRepository.countByBrandAndName(brand, name);
    }

    @Override
    public PageResponse<ProductDto> searchProducts(String category, String brand, String query, Pageable pageable) {
        return PageResponse.of(
                productRepository.findAll(ProductSpecifications.search(category, brand, query), pageable),
                this::convertToDto);
    }

    @Override
    public List<String> getBrands() {
        return productRepository.findDistinctBrands();
    }

    @Override
    public List<ProductDto> getConvertedProducts(List<Product> products) {
      return products.stream().map(this::convertToDto).toList();
    }

    @Override
    public ProductDto convertToDto(Product product) {
        ProductDto productDto = modelMapper.map(product, ProductDto.class);
        List<Image> images = imageRepository.findByProductIdOrderByIdAsc(product.getId());
        List<ImageDto> imageDtos = images.stream()
                .map(image -> modelMapper.map(image, ImageDto.class))
                .toList();
        productDto.setImages(imageDtos);
        return productDto;
    }
}
