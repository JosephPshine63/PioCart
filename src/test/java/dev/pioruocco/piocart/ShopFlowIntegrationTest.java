package dev.pioruocco.piocart;

import com.fasterxml.jackson.databind.JsonNode;
import dev.pioruocco.piocart.model.Category;
import dev.pioruocco.piocart.model.Product;
import dev.pioruocco.piocart.repository.CategoryRepository;
import dev.pioruocco.piocart.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ShopFlowIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CategoryRepository categoryRepository;

    private Product newProduct(String name, String brand, int inventory) {
        String categoryName = "cat-" + UUID.randomUUID();
        Category category = categoryRepository.save(new Category(categoryName));
        return productRepository.save(new Product(name, brand, new BigDecimal("10.00"), inventory, "desc", category));
    }

    @Test
    void searchFiltersByTextAndReturnsPage() throws Exception {
        String brand = "brand-" + UUID.randomUUID();
        newProduct("Searchable Lamp", brand, 5);
        newProduct("Other Thing", brand, 5);

        mockMvc.perform(get("/api/v1/products").param("brand", brand).param("q", "lamp"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].name").value("Searchable Lamp"));
    }

    @Test
    void emptyListIsOkAndMissingResourceIs404() throws Exception {
        mockMvc.perform(get("/api/v1/products/product/by-brand").param("brand", "no-such-brand"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());
        mockMvc.perform(get("/api/v1/products/product/999999/product"))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/categories/category/by-name/no-such-category"))
                .andExpect(status().isNotFound());
    }

    @Test
    void cartAddUpdateRemoveKeepsTotalsAndChecksStock() throws Exception {
        Product product = newProduct("Mug", "Acme", 3);
        String token = registerUser();

        mockMvc.perform(get("/api/v1/carts/me").with(bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isEmpty());

        JsonNode cart = data(mockMvc.perform(post("/api/v1/cartItems/me/add").with(bearer(token))
                        .param("productId", product.getId().toString())
                        .param("quantity", "2"))
                .andExpect(status().isOk())
                .andReturn());
        assertThat(cart.get("totalAmount").decimalValue()).isEqualByComparingTo("20.00");
        assertThat(cart.get("items").get(0).get("product").get("id").asLong()).isEqualTo(product.getId());

        mockMvc.perform(post("/api/v1/cartItems/me/add").with(bearer(token))
                        .param("productId", product.getId().toString())
                        .param("quantity", "5"))
                .andExpect(status().isConflict());

        mockMvc.perform(put("/api/v1/cartItems/me/{productId}", product.getId()).with(bearer(token))
                        .param("quantity", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalAmount").value(30.00));

        // carts are per user
        mockMvc.perform(get("/api/v1/carts/me").with(bearer(registerUser())))
                .andExpect(jsonPath("$.data.items").isEmpty());

        mockMvc.perform(delete("/api/v1/cartItems/me/{productId}", product.getId()).with(bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isEmpty());

        mockMvc.perform(get("/api/v1/carts/me").with(bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cartId").value(cart.get("cartId").asLong()))
                .andExpect(jsonPath("$.data.totalAmount").value(0));
    }

    @Test
    void uploadedImageCanBeDownloaded() throws Exception {
        Product product = newProduct("Poster", "Acme", 1);
        byte[] bytes = {(byte) 0x89, 'P', 'N', 'G'};

        JsonNode images = data(mockMvc.perform(multipart("/api/v1/images/upload")
                        .file(new MockMultipartFile("files", "poster.png", "image/png", bytes))
                        .with(bearer(adminToken()))
                        .param("productId", product.getId().toString()))
                .andExpect(status().isOk())
                .andReturn());

        mockMvc.perform(get(images.get(0).get("downloadUrl").asText()))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(content().bytes(bytes));
    }

    @Test
    void placeOrderSnapshotsCartAndDecrementsInventory() throws Exception {
        Product product = newProduct("Notebook", "Acme", 10);
        String token = registerUser();

        mockMvc.perform(post("/api/v1/cartItems/me/add").with(bearer(token))
                        .param("productId", product.getId().toString())
                        .param("quantity", "4"))
                .andExpect(status().isOk());

        JsonNode order = data(mockMvc.perform(post("/api/v1/orders/order").with(bearer(token)))
                .andExpect(status().isOk())
                .andReturn());
        long orderId = order.get("id").asLong();
        assertThat(order.get("status").asText()).isEqualTo("PENDING");
        assertThat(order.get("totalAmount").decimalValue()).isEqualByComparingTo("40.00");
        assertThat(order.get("items").get(0).get("quantity").asInt()).isEqualTo(4);
        assertThat(productRepository.findById(product.getId()).orElseThrow().getInventory()).isEqualTo(6);

        mockMvc.perform(get("/api/v1/orders/me").with(bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(orderId));
        mockMvc.perform(get("/api/v1/orders/{orderId}/order", orderId).with(bearer(token)))
                .andExpect(status().isOk());

        // other users can't see it, admins can
        mockMvc.perform(get("/api/v1/orders/{orderId}/order", orderId).with(bearer(registerUser())))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/orders/{orderId}/order", orderId).with(bearer(adminToken())))
                .andExpect(status().isOk());

        // the cart was emptied
        mockMvc.perform(get("/api/v1/carts/me").with(bearer(token)))
                .andExpect(jsonPath("$.data.items").isEmpty());
        mockMvc.perform(post("/api/v1/orders/order").with(bearer(token)))
                .andExpect(status().isBadRequest());
    }
}
