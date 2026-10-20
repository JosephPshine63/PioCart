package dev.pioruocco.piocart;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CatalogAdminIntegrationTest extends AbstractIntegrationTest {

    @Test
    void productWritesAreValidated() throws Exception {
        String admin = adminToken();
        Map<String, Object> product = productBody("cat-" + UUID.randomUUID());

        long id = data(mockMvc.perform(post("/api/v1/products/add").with(bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(product)))
                .andExpect(status().isOk())
                .andReturn()).get("id").asLong();

        product.put("price", -1);
        mockMvc.perform(post("/api/v1/products/add").with(bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(product)))
                .andExpect(status().isBadRequest());

        product.put("price", 5);
        product.put("name", " ");
        mockMvc.perform(put("/api/v1/products/product/{id}/update", id).with(bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(product)))
                .andExpect(status().isBadRequest());

        product.put("name", "Renamed");
        product.put("category", Map.of("name", " "));
        mockMvc.perform(put("/api/v1/products/product/{id}/update", id).with(bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(product)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deletingAProductInACartRemovesItFromTheCart() throws Exception {
        String admin = adminToken();
        long id = addProduct(admin, "cat-" + UUID.randomUUID());
        String user = registerUser();
        mockMvc.perform(post("/api/v1/cartItems/me/add").with(bearer(user))
                        .param("productId", String.valueOf(id)).param("quantity", "2"))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/products/product/{id}/delete", id).with(bearer(admin)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/carts/me").with(bearer(user)))
                .andExpect(jsonPath("$.data.items").isEmpty())
                .andExpect(jsonPath("$.data.totalAmount").value(0));
        mockMvc.perform(get("/api/v1/products/product/{id}/product", id))
                .andExpect(status().isNotFound());
    }

    @Test
    void categoriesKeepUniqueNamesAndCantBeDeletedWhileInUse() throws Exception {
        String admin = adminToken();
        String name = "cat-" + UUID.randomUUID();
        addProduct(admin, name);
        long categoryId = data(mockMvc.perform(get("/api/v1/categories/category/by-name/{name}", name))
                .andReturn()).get("id").asLong();

        String other = "cat-" + UUID.randomUUID();
        JsonNode created = data(mockMvc.perform(post("/api/v1/categories/add").with(bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("name", "  " + other + "  "))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value(other))
                .andReturn());

        mockMvc.perform(post("/api/v1/categories/add").with(bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("name", ""))))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/v1/categories/category/{id}/update", created.get("id").asLong()).with(bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("name", name))))
                .andExpect(status().isConflict());

        mockMvc.perform(delete("/api/v1/categories/category/{id}/delete", categoryId).with(bearer(admin)))
                .andExpect(status().isConflict());
        mockMvc.perform(delete("/api/v1/categories/category/{id}/delete", created.get("id").asLong()).with(bearer(admin)))
                .andExpect(status().isOk());
    }

    @Test
    void onlyImagesCanBeUploaded() throws Exception {
        String admin = adminToken();
        long id = addProduct(admin, "cat-" + UUID.randomUUID());

        mockMvc.perform(multipart("/api/v1/images/upload")
                        .file(new MockMultipartFile("files", "notes.txt", "text/plain", "hello".getBytes()))
                        .with(bearer(admin))
                        .param("productId", String.valueOf(id)))
                .andExpect(status().isBadRequest());
        mockMvc.perform(multipart("/api/v1/images/upload")
                        .file(new MockMultipartFile("files", "logo.svg", "image/svg+xml", "<svg/>".getBytes()))
                        .with(bearer(admin))
                        .param("productId", String.valueOf(id)))
                .andExpect(status().isBadRequest());
    }

    private long addProduct(String adminToken, String category) throws Exception {
        return data(mockMvc.perform(post("/api/v1/products/add").with(bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON).content(json(productBody(category))))
                .andExpect(status().isOk())
                .andReturn()).get("id").asLong();
    }

    private static Map<String, Object> productBody(String category) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", "Desk");
        body.put("brand", "Acme");
        body.put("price", 10);
        body.put("inventory", 5);
        body.put("description", "A desk");
        body.put("category", Map.of("name", category));
        return body;
    }
}
