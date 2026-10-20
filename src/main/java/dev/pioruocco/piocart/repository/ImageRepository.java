package dev.pioruocco.piocart.repository;

import dev.pioruocco.piocart.model.Image;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ImageRepository extends JpaRepository<Image, Long> {
    List<Image> findByProductIdOrderByIdAsc(Long productId);
    Optional<Image> findFirstByProductIdOrderByIdAsc(Long productId);
}
