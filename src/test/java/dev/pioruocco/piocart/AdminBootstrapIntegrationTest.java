package dev.pioruocco.piocart;

import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = {
        "app.admin.email=Boot.Admin@Example.com",
        "app.admin.password=bootstrap123"
})
class AdminBootstrapIntegrationTest extends AbstractIntegrationTest {

    @Test
    void createsTheConfiguredAdminOnStartup() throws Exception {
        String token = login("boot.admin@example.com", "bootstrap123");

        mockMvc.perform(get("/api/v1/auth/me").with(bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("ADMIN"));
        mockMvc.perform(get("/api/v1/orders").with(bearer(token)))
                .andExpect(status().isOk());
    }
}
