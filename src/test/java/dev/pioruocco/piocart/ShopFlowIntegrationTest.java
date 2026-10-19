package dev.pioruocco.piocart;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.pioruocco.piocart.model.Cart;
import dev.pioruocco.piocart.model.Category;
import dev.pioruocco.piocart.model.Product;
import dev.pioruocco.piocart.model.User;
import dev.pioruocco.piocart.repository.CartRepository;
import dev.pioruocco.piocart.repository.CategoryRepository;
import dev.pioruocco.piocart.repository.ProductRepository;
import dev.pioruocco.piocart.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ShopFlowIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CartRepository cartRepository;

    private Product newProduct(String name, String brand, int inventory) {
        String categoryName = "cat-" + UUID.randomUUID();
        Category category = categoryRepository.save(new Category(categoryName));
        return productRepository.save(new Product(name, brand, new BigDecimal("10.00"), inventory, "desc", category));
    }

    private JsonNode data(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("data");
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

        JsonNode cart = data(mockMvc.perform(post("/api/v1/cartItems/item/add")
                        .param("productId", product.getId().toString())
                        .param("quantity", "2"))
                .andExpect(status().isOk())
                .andReturn());
        long cartId = cart.get("cartId").asLong();
        assertThat(cart.get("totalAmount").decimalValue()).isEqualByComparingTo("20.00");
        assertThat(cart.get("items").get(0).get("product").get("id").asLong()).isEqualTo(product.getId());

        mockMvc.perform(post("/api/v1/cartItems/item/add")
                        .param("cartId", String.valueOf(cartId))
                        .param("productId", product.getId().toString())
                        .param("quantity", "5"))
                .andExpect(status().isConflict());

        mockMvc.perform(put("/api/v1/cartItems/cart/{cartId}/product/{productId}/update", cartId, product.getId())
                        .param("quantity", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalAmount").value(30.00));

        mockMvc.perform(delete("/api/v1/cartItems/cart/{cartId}/product/{productId}/remove", cartId, product.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isEmpty());

        mockMvc.perform(get("/api/v1/carts/{cartId}/my-cart", cartId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalAmount").value(0));
    }

    @Test
    void uploadedImageCanBeDownloaded() throws Exception {
        Product product = newProduct("Poster", "Acme", 1);
        byte[] bytes = {(byte) 0x89, 'P', 'N', 'G'};

        JsonNode images = data(mockMvc.perform(multipart("/api/v1/images/upload")
                        .file(new MockMultipartFile("files", "poster.png", "image/png", bytes))
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
        User user = new User();
        user.setEmail(UUID.randomUUID() + "@example.com");
        user.setFirstName("Test");
        user.setLastName("User");
        user = userRepository.save(user);

        Cart cart = new Cart();
        cart.setUser(user);
        cart = cartRepository.save(cart);
        mockMvc.perform(post("/api/v1/cartItems/item/add")
                        .param("cartId", cart.getId().toString())
                        .param("productId", product.getId().toString())
                        .param("quantity", "4"))
                .andExpect(status().isOk());

        JsonNode order = data(mockMvc.perform(post("/api/v1/orders/order").param("userId", user.getId().toString()))
                .andExpect(status().isOk())
                .andReturn());
        assertThat(order.get("status").asText()).isEqualTo("PENDING");
        assertThat(order.get("userId").asLong()).isEqualTo(user.getId());
        assertThat(order.get("totalAmount").decimalValue()).isEqualByComparingTo("40.00");
        assertThat(order.get("items").get(0).get("quantity").asInt()).isEqualTo(4);
        assertThat(productRepository.findById(product.getId()).orElseThrow().getInventory()).isEqualTo(6);

        mockMvc.perform(get("/api/v1/orders/user/{userId}", user.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(order.get("id").asLong()));
        mockMvc.perform(get("/api/v1/orders/{orderId}/order", order.get("id").asLong()))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/orders/order").param("userId", user.getId().toString()))
                .andExpect(status().isNotFound());
    }
}
