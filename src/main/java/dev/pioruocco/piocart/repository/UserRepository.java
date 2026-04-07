package dev.pioruocco.piocart.repository;

import dev.pioruocco.piocart.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
}
