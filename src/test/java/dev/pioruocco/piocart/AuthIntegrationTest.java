package dev.pioruocco.piocart;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthIntegrationTest extends AbstractIntegrationTest {

    @Test
    void registerHashesPasswordAndReturnsUsableToken() throws Exception {
        String email = uniqueEmail();
        String token = data(mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("firstName", "Ada", "lastName", "Lovelace",
                                "email", email, "password", PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.email").value(email))
                .andExpect(jsonPath("$.data.user.role").value("USER"))
                .andExpect(jsonPath("$.data.user.password").doesNotExist())
                .andReturn()).get("token").asText();

        assertThat(userRepository.findByEmail(email).orElseThrow().getPassword())
                .isNotEqualTo(PASSWORD)
                .startsWith("$2");

        mockMvc.perform(get("/api/v1/auth/me").with(bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.firstName").value("Ada"));
    }

    @Test
    void registerRejectsDuplicateEmailAndInvalidInput() throws Exception {
        String email = uniqueEmail();
        var body = Map.of("firstName", "A", "lastName", "B", "email", email, "password", PASSWORD);
        mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(json(body)))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(json(body)))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("firstName", "A", "lastName", "B",
                                "email", "not-an-email", "password", "short"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void loginChecksPassword() throws Exception {
        String email = uniqueEmail();
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("firstName", "A", "lastName", "B", "email", email, "password", PASSWORD))))
                .andExpect(status().isOk());

        assertThat(login(email.toUpperCase(), PASSWORD)).isNotBlank();
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", email, "password", "wrong-password"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void protectedEndpointsNeedAValidToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication required"));
        mockMvc.perform(get("/api/v1/carts/me").with(bearer("not.a.jwt")))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/orders/me"))
                .andExpect(status().isUnauthorized());

        // the catalog stays public, even with a broken token
        mockMvc.perform(get("/api/v1/products").with(bearer("not.a.jwt")))
                .andExpect(status().isOk());
    }

    @Test
    void catalogWritesAndUserAdminRequireAdminRole() throws Exception {
        String userToken = registerUser();
        var category = Map.of("name", "cat-" + System.nanoTime());

        mockMvc.perform(post("/api/v1/categories/add").with(bearer(userToken))
                        .contentType(MediaType.APPLICATION_JSON).content(json(category)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
        mockMvc.perform(get("/api/v1/users/1/user").with(bearer(userToken)))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/categories/add")
                        .contentType(MediaType.APPLICATION_JSON).content(json(category)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/categories/add").with(bearer(adminToken()))
                        .contentType(MediaType.APPLICATION_JSON).content(json(category)))
                .andExpect(status().isOk());
    }

    @Test
    void userCanUpdateOwnProfile() throws Exception {
        String token = registerUser();
        mockMvc.perform(put("/api/v1/users/me").with(bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("firstName", "New", "lastName", "Name"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.firstName").value("New"));
    }
}
