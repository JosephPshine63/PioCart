package dev.pioruocco.piocart.controller;

import dev.pioruocco.piocart.dto.ProductDto;
import dev.pioruocco.piocart.model.Product;
import dev.pioruocco.piocart.request.AddProductRequest;
import dev.pioruocco.piocart.request.ProductUpdateRequest;
import dev.pioruocco.piocart.response.ApiResponse;
import dev.pioruocco.piocart.response.PageResponse;
import dev.pioruocco.piocart.service.product.IProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("${api.prefix}/products")
public class ProductController {
    private final IProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse> searchProducts(@RequestParam(required = false) String category,
                                                      @RequestParam(required = false) String brand,
                                                      @RequestParam(required = false) String q,
                                                      @PageableDefault(size = 12, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<ProductDto> products = productService.searchProducts(category, brand, q, pageable);
        return ResponseEntity.ok(new ApiResponse("success", products));
    }

    @GetMapping("/brands")
    public ResponseEntity<ApiResponse> getBrands() {
        return ResponseEntity.ok(new ApiResponse("success", productService.getBrands()));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse> getAllProducts() {
        List<Product> products = productService.getAllProducts();
        List<ProductDto> convertedProducts = productService.getConvertedProducts(products);
        return  ResponseEntity.ok(new ApiResponse("success", convertedProducts));
    }

    @GetMapping("product/{productId}/product")
    public ResponseEntity<ApiResponse> getProductById(@PathVariable Long productId) {
        Product product = productService.getProductById(productId);
        ProductDto productDto = productService.convertToDto(product);
        return  ResponseEntity.ok(new ApiResponse("success", productDto));
    }

    @PostMapping("/add")
    public ResponseEntity<ApiResponse> addProduct(@Valid @RequestBody AddProductRequest product) {
        Product theProduct = productService.addProduct(product);
        ProductDto productDto = productService.convertToDto(theProduct);
        return ResponseEntity.ok(new ApiResponse("Add product success!", productDto));
    }

    @PutMapping("/product/{productId}/update")
    public  ResponseEntity<ApiResponse> updateProduct(@Valid @RequestBody ProductUpdateRequest request, @PathVariable Long productId) {
        Product theProduct = productService.updateProduct(request, productId);
        ProductDto productDto = productService.convertToDto(theProduct);
        return ResponseEntity.ok(new ApiResponse("Update product success!", productDto));
    }

    @DeleteMapping("/product/{productId}/delete")
    public ResponseEntity<ApiResponse> deleteProduct(@PathVariable Long productId) {
        productService.deleteProductById(productId);
        return ResponseEntity.ok(new ApiResponse("Delete product success!", productId));
    }

    @GetMapping("/products/by/brand-and-name")
    public ResponseEntity<ApiResponse> getProductByBrandAndName(@RequestParam String brandName, @RequestParam String productName) {
        List<Product> products = productService.getProductsByBrandAndName(brandName, productName);
        return  ResponseEntity.ok(new ApiResponse("success", productService.getConvertedProducts(products)));
    }

    @GetMapping("/products/by/category-and-brand")
    public ResponseEntity<ApiResponse> getProductByCategoryAndBrand(@RequestParam String category, @RequestParam String brand){
        List<Product> products = productService.getProductsByCategoryAndBrand(category, brand);
        return  ResponseEntity.ok(new ApiResponse("success", productService.getConvertedProducts(products)));
    }

    @GetMapping("/products/{name}/products")
    public ResponseEntity<ApiResponse> getProductByName(@PathVariable String name){
        List<Product> products = productService.getProductsByName(name);
        return  ResponseEntity.ok(new ApiResponse("success", productService.getConvertedProducts(products)));
    }

    @GetMapping("/product/by-brand")
    public ResponseEntity<ApiResponse> findProductByBrand(@RequestParam String brand) {
        List<Product> products = productService.getProductsByBrand(brand);
        return  ResponseEntity.ok(new ApiResponse("success", productService.getConvertedProducts(products)));
    }

    @GetMapping("/product/{category}/all/products")
    public ResponseEntity<ApiResponse> findProductByCategory(@PathVariable String category) {
        List<Product> products = productService.getProductsByCategory(category);
        return  ResponseEntity.ok(new ApiResponse("success", productService.getConvertedProducts(products)));
    }

    @GetMapping("/product/count/by-brand/and-name")
    public ResponseEntity<ApiResponse> countProductsByBrandAndName(@RequestParam String brand, @RequestParam String name) {
        var productCount = productService.countProductsByBrandAndName(brand, name);
        return ResponseEntity.ok(new ApiResponse("Product count!", productCount));
    }


}
