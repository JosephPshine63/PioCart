package dev.pioruocco.piocart.service.product;
import dev.pioruocco.piocart.dto.ProductDto;
import dev.pioruocco.piocart.model.Product;
import dev.pioruocco.piocart.request.AddProductRequest;
import dev.pioruocco.piocart.request.ProductUpdateRequest;


import dev.pioruocco.piocart.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IProductService {
    Product addProduct(AddProductRequest product);
    Product getProductById(Long id);
    void deleteProductById(Long id);
    Product updateProduct(ProductUpdateRequest product, Long productId);
    List<Product> getAllProducts();
    List<Product> getProductsByCategory(String category);
    List<Product> getProductsByBrand(String brand);
    List<Product> getProductsByCategoryAndBrand(String category, String brand);
    List<Product> getProductsByName(String name);
    List<Product> getProductsByBrandAndName(String category, String name);
    Long countProductsByBrandAndName(String brand, String name);
    PageResponse<ProductDto> searchProducts(String category, String brand, String query, Pageable pageable);
    List<String> getBrands();

    List<ProductDto> getConvertedProducts(List<Product> products);

    ProductDto convertToDto(Product product);
}
