package dev.pioruocco.piocart.config;

import dev.pioruocco.piocart.enums.Role;
import dev.pioruocco.piocart.model.User;
import dev.pioruocco.piocart.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Creates the first ADMIN account from ADMIN_EMAIL / ADMIN_PASSWORD, since registration only creates USERs.
 * Does nothing when the variables are empty or the account already exists.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminBootstrap implements CommandLineRunner {
    private static final int MIN_PASSWORD_LENGTH = 8;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:}")
    private String email;
    @Value("${app.admin.password:}")
    private String password;

    @Override
    public void run(String... args) {
        if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
            return;
        }
        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalStateException("ADMIN_PASSWORD must be at least " + MIN_PASSWORD_LENGTH + " characters");
        }
        String normalizedEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            return;
        }
        User admin = new User();
        admin.setEmail(normalizedEmail);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setFirstName("Admin");
        admin.setLastName("PioCart");
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);
        log.info("Created ADMIN account {}", normalizedEmail);
    }
}
