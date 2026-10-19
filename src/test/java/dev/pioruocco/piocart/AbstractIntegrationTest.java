package dev.pioruocco.piocart;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.pioruocco.piocart.enums.Role;
import dev.pioruocco.piocart.model.User;
import dev.pioruocco.piocart.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.testcontainers.containers.PostgreSQLContainer;

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public abstract class AbstractIntegrationTest {

    // Singleton container pattern: @Testcontainers/@Container would stop this per subclass while Spring's cached context still points at the dead port.
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:15-alpine");

    static {
        POSTGRES.start();
    }

    protected static final String PASSWORD = "password123";

    @Autowired
    protected MockMvc mockMvc;
    @Autowired
    protected ObjectMapper objectMapper;
    @Autowired
    protected UserRepository userRepository;
    @Autowired
    protected PasswordEncoder passwordEncoder;

    protected JsonNode data(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("data");
    }

    protected String json(Object body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    protected static String uniqueEmail() {
        return UUID.randomUUID() + "@example.com";
    }

    /** Registers a new USER through the API and returns its token. */
    protected String registerUser() throws Exception {
        return data(mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("firstName", "Test", "lastName", "User",
                                "email", uniqueEmail(), "password", PASSWORD))))
                .andExpect(status().isOk())
                .andReturn()).get("token").asText();
    }

    /** Creates an ADMIN directly in the database (registration only creates USERs) and logs in. */
    protected String adminToken() throws Exception {
        User admin = new User();
        admin.setEmail(uniqueEmail());
        admin.setFirstName("Admin");
        admin.setLastName("Test");
        admin.setPassword(passwordEncoder.encode(PASSWORD));
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);
        return login(admin.getEmail(), PASSWORD);
    }

    protected String login(String email, String password) throws Exception {
        return data(mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn()).get("token").asText();
    }

    protected static RequestPostProcessor bearer(String token) {
        return request -> {
            request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token);
            return request;
        };
    }
}
