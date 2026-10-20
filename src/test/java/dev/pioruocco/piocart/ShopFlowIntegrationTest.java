package dev.pioruocco.piocart;

import com.fasterxml.jackson.databind.JsonNode;
import dev.pioruocco.piocart.enums.OrderStatus;
import dev.pioruocco.piocart.exceptions.PaymentProviderException;
import dev.pioruocco.piocart.model.Category;
import dev.pioruocco.piocart.model.Order;
import dev.pioruocco.piocart.model.Product;
import dev.pioruocco.piocart.repository.CategoryRepository;
import dev.pioruocco.piocart.repository.OrderRepository;
import dev.pioruocco.piocart.repository.ProductRepository;
import dev.pioruocco.piocart.service.payment.PaymentSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ShopFlowIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private JdbcTemplate jdbcTemplate;

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
    void paidCheckoutPlacesOrderDecrementsInventoryAndEmptiesCart() throws Exception {
        Product product = newProduct("Notebook", "Acme", 10);
        String token = registerUser();
        addToCart(token, product, 4);

        JsonNode checkout = data(mockMvc.perform(post("/api/v1/orders/checkout").with(bearer(token)))
                .andExpect(status().isOk())
                .andReturn());
        long orderId = checkout.get("orderId").asLong();
        assertThat(checkout.get("paymentUrl").asText()).startsWith("https://checkout.example/");

        // nothing is taken from stock or the cart until the payment is confirmed
        Order pending = orderRepository.findById(orderId).orElseThrow();
        assertThat(pending.getOrderStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(productRepository.findById(product.getId()).orElseThrow().getInventory()).isEqualTo(10);
        mockMvc.perform(get("/api/v1/carts/me").with(bearer(token)))
                .andExpect(jsonPath("$.data.items").isNotEmpty());

        String sessionId = pending.getPaymentSessionId();
        stubSession(sessionId, true, 4000L);

        // another user can't confirm someone else's payment
        mockMvc.perform(post("/api/v1/orders/confirm").with(bearer(registerUser())).param("sessionId", sessionId))
                .andExpect(status().isNotFound());

        JsonNode order = data(mockMvc.perform(post("/api/v1/orders/confirm").with(bearer(token)).param("sessionId", sessionId))
                .andExpect(status().isOk())
                .andReturn());
        assertThat(order.get("id").asLong()).isEqualTo(orderId);
        assertThat(order.get("status").asText()).isEqualTo("PROCESSING");
        assertThat(order.get("totalAmount").decimalValue()).isEqualByComparingTo("40.00");
        assertThat(order.get("items").get(0).get("quantity").asInt()).isEqualTo(4);
        assertThat(productRepository.findById(product.getId()).orElseThrow().getInventory()).isEqualTo(6);
        mockMvc.perform(get("/api/v1/carts/me").with(bearer(token)))
                .andExpect(jsonPath("$.data.items").isEmpty());

        // confirming again (e.g. reloading the success page) changes nothing
        mockMvc.perform(post("/api/v1/orders/confirm").with(bearer(token)).param("sessionId", sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PROCESSING"));
        assertThat(productRepository.findById(product.getId()).orElseThrow().getInventory()).isEqualTo(6);

        mockMvc.perform(get("/api/v1/orders/me").with(bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(orderId))
                .andExpect(jsonPath("$.data[0].paidAt").isNotEmpty())
                .andExpect(jsonPath("$.data[0].items[0].productName").value("Notebook"));
        mockMvc.perform(get("/api/v1/orders/{orderId}/order", orderId).with(bearer(token)))
                .andExpect(status().isOk());

        // other users can't see it, admins can
        mockMvc.perform(get("/api/v1/orders/{orderId}/order", orderId).with(bearer(registerUser())))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/orders/{orderId}/order", orderId).with(bearer(adminToken())))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/orders/checkout").with(bearer(token)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unpaidOrWrongAmountSessionIsRejected() throws Exception {
        Product product = newProduct("Pen", "Acme", 5);
        String token = registerUser();
        addToCart(token, product, 2);
        String sessionId = checkoutSessionId(token);

        stubSession(sessionId, false, null);
        mockMvc.perform(post("/api/v1/orders/confirm").with(bearer(token)).param("sessionId", sessionId))
                .andExpect(status().isPaymentRequired());

        stubSession(sessionId, true, 1L);
        mockMvc.perform(post("/api/v1/orders/confirm").with(bearer(token)).param("sessionId", sessionId))
                .andExpect(status().isPaymentRequired());

        assertThat(orderStatus(sessionId))
                .isEqualTo(OrderStatus.PENDING);
        assertThat(productRepository.findById(product.getId()).orElseThrow().getInventory()).isEqualTo(5);
    }

    @Test
    void stockSoldOutDuringPaymentCancelsAndRefunds() throws Exception {
        Product product = newProduct("Lamp", "Acme", 2);
        String token = registerUser();
        addToCart(token, product, 2);
        String sessionId = checkoutSessionId(token);

        jdbcTemplate.update("update product set inventory = 1 where id = ?", product.getId());
        stubSession(sessionId, true, 2000L);

        mockMvc.perform(post("/api/v1/orders/confirm").with(bearer(token)).param("sessionId", sessionId))
                .andExpect(status().isConflict());

        assertThat(orderStatus(sessionId))
                .isEqualTo(OrderStatus.CANCELLED);
        assertThat(productRepository.findById(product.getId()).orElseThrow().getInventory()).isEqualTo(1);
        verify(paymentService).refundSession(sessionId);
        // it was paid, so the customer still sees it in the history
        mockMvc.perform(get("/api/v1/orders/me").with(bearer(token)))
                .andExpect(jsonPath("$.data[0].status").value("CANCELLED"));
    }

    @Test
    void newCheckoutCancelsTheAbandonedOne() throws Exception {
        Product product = newProduct("Cup", "Acme", 5);
        String token = registerUser();
        addToCart(token, product, 1);
        String first = checkoutSessionId(token);
        stubSession(first, false, null);

        String second = checkoutSessionId(token);

        verify(paymentService).expireSession(first);
        assertThat(orderStatus(first))
                .isEqualTo(OrderStatus.CANCELLED);
        assertThat(orderStatus(second))
                .isEqualTo(OrderStatus.PENDING);
        mockMvc.perform(post("/api/v1/orders/confirm").with(bearer(token)).param("sessionId", first))
                .andExpect(status().isPaymentRequired());
        // neither the abandoned nor the still unpaid checkout is part of the order history
        mockMvc.perform(get("/api/v1/orders/me").with(bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    void checkoutAnswers502WhenThePaymentProviderFails() throws Exception {
        Product product = newProduct("Bag", "Acme", 5);
        String token = registerUser();
        addToCart(token, product, 1);
        when(paymentService.createCheckoutSession(any(), any()))
                .thenThrow(new PaymentProviderException("Payments are not configured"));

        mockMvc.perform(post("/api/v1/orders/checkout").with(bearer(token)))
                .andExpect(status().isBadGateway());
        mockMvc.perform(get("/api/v1/orders/me").with(bearer(token)))
                .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    void adminMovesPaidOrdersThroughTheirStatuses() throws Exception {
        Product product = newProduct("Chair", "Acme", 5);
        String token = registerUser();
        long orderId = paidOrder(token, product, 2);
        String admin = adminToken();

        mockMvc.perform(get("/api/v1/orders").with(bearer(token)))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/v1/orders/{id}/status", orderId).with(bearer(token)).param("status", "SHIPPED"))
                .andExpect(status().isForbidden());

        JsonNode page = data(mockMvc.perform(get("/api/v1/orders").with(bearer(admin)).param("status", "PROCESSING"))
                .andExpect(status().isOk())
                .andReturn());
        assertThat(page.get("content").findValuesAsText("id")).contains(String.valueOf(orderId));
        assertThat(page.get("content").get(0).get("customerEmail").asText()).contains("@example.com");

        // an unpaid checkout is not part of the admin list either
        addToCart(token, product, 1);
        long pendingId = data(mockMvc.perform(post("/api/v1/orders/checkout").with(bearer(token)))
                .andReturn()).get("orderId").asLong();
        assertThat(data(mockMvc.perform(get("/api/v1/orders").with(bearer(admin)).param("size", "100"))
                .andReturn()).get("content").findValuesAsText("id")).doesNotContain(String.valueOf(pendingId));
        mockMvc.perform(put("/api/v1/orders/{id}/status", pendingId).with(bearer(admin)).param("status", "SHIPPED"))
                .andExpect(status().isConflict());

        mockMvc.perform(put("/api/v1/orders/{id}/status", orderId).with(bearer(admin)).param("status", "DELIVERED"))
                .andExpect(status().isConflict());
        mockMvc.perform(put("/api/v1/orders/{id}/status", orderId).with(bearer(admin)).param("status", "SHIPPED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SHIPPED"));
        mockMvc.perform(put("/api/v1/orders/{id}/status", orderId).with(bearer(admin)).param("status", "CANCELLED"))
                .andExpect(status().isConflict());
        mockMvc.perform(put("/api/v1/orders/{id}/status", orderId).with(bearer(admin)).param("status", "DELIVERED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DELIVERED"));
        mockMvc.perform(put("/api/v1/orders/{id}/status", orderId).with(bearer(admin)).param("status", "NOPE"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cancellingAPaidOrderRefundsAndRestocks() throws Exception {
        Product product = newProduct("Sofa", "Acme", 5);
        String token = registerUser();
        long orderId = paidOrder(token, product, 3);
        assertThat(productRepository.findById(product.getId()).orElseThrow().getInventory()).isEqualTo(2);

        mockMvc.perform(put("/api/v1/orders/{id}/status", orderId).with(bearer(adminToken())).param("status", "CANCELLED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));

        assertThat(productRepository.findById(product.getId()).orElseThrow().getInventory()).isEqualTo(5);
        verify(paymentService).refundSession(orderRepository.findById(orderId).orElseThrow().getPaymentSessionId());

        // an ordered product can't be deleted, its order lines still point at it
        mockMvc.perform(delete("/api/v1/products/product/{id}/delete", product.getId()).with(bearer(adminToken())))
                .andExpect(status().isConflict());
    }

    @BeforeEach
    void stubPaymentProvider() {
        when(paymentService.getCurrency()).thenReturn("eur");
        when(paymentService.createCheckoutSession(any(), any())).thenAnswer(invocation -> {
            String id = "cs_test_" + UUID.randomUUID();
            return new PaymentSession(id, "https://checkout.example/" + id, "open", false, null, "eur");
        });
    }

    private void stubSession(String sessionId, boolean paid, Long amountTotal) {
        when(paymentService.getSession(sessionId)).thenReturn(new PaymentSession(
                sessionId, null, paid ? "complete" : "open", paid, amountTotal, "eur"));
    }

    // findByPaymentSessionId takes a lock, so it only runs inside a transaction
    private OrderStatus orderStatus(String sessionId) {
        return orderRepository.findAll().stream()
                .filter(order -> sessionId.equals(order.getPaymentSessionId()))
                .findFirst().orElseThrow()
                .getOrderStatus();
    }

    private void addToCart(String token, Product product, int quantity) throws Exception {
        mockMvc.perform(post("/api/v1/cartItems/me/add").with(bearer(token))
                        .param("productId", product.getId().toString())
                        .param("quantity", String.valueOf(quantity)))
                .andExpect(status().isOk());
    }

    // Checks out the product and confirms the payment, returning the PROCESSING order's id
    private long paidOrder(String token, Product product, int quantity) throws Exception {
        addToCart(token, product, quantity);
        String sessionId = checkoutSessionId(token);
        stubSession(sessionId, true, product.getPrice().multiply(BigDecimal.valueOf(quantity)).movePointRight(2).longValue());
        return data(mockMvc.perform(post("/api/v1/orders/confirm").with(bearer(token)).param("sessionId", sessionId))
                .andExpect(status().isOk())
                .andReturn()).get("id").asLong();
    }

    private String checkoutSessionId(String token) throws Exception {
        long orderId = data(mockMvc.perform(post("/api/v1/orders/checkout").with(bearer(token)))
                .andExpect(status().isOk())
                .andReturn()).get("orderId").asLong();
        return orderRepository.findById(orderId).orElseThrow().getPaymentSessionId();
    }
}
