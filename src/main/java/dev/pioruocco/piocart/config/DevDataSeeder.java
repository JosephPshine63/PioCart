package dev.pioruocco.piocart.config;

import dev.pioruocco.piocart.model.Category;
import dev.pioruocco.piocart.model.Product;
import dev.pioruocco.piocart.repository.CategoryRepository;
import dev.pioruocco.piocart.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Fills an empty database with a small demo catalog. Active only with the "dev" profile.
 */
@Slf4j
@Profile("dev")
@Component
@RequiredArgsConstructor
public class DevDataSeeder implements CommandLineRunner {
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional
    @Override
    public void run(String... args) {
        if (productRepository.count() > 0) {
            return;
        }
        Category electronics = categoryRepository.save(new Category("Electronics"));
        Category books = categoryRepository.save(new Category("Books"));
        Category home = categoryRepository.save(new Category("Home"));

        productRepository.saveAll(List.of(
                new Product("Wireless Headphones", "Sony", new BigDecimal("199.90"), 25,
                        "Over-ear headphones with active noise cancelling and 30h battery.", electronics),
                new Product("Smartphone 128GB", "Samsung", new BigDecimal("649.00"), 12,
                        "6.2\" display, triple camera, 5G.", electronics),
                new Product("Mechanical Keyboard", "Logitech", new BigDecimal("129.99"), 40,
                        "Tenkeyless keyboard with tactile switches and RGB backlight.", electronics),
                new Product("4K Monitor 27\"", "LG", new BigDecimal("349.00"), 8,
                        "IPS panel, HDR10, USB-C with 65W power delivery.", electronics),
                new Product("Clean Code", "Prentice Hall", new BigDecimal("34.50"), 60,
                        "A handbook of agile software craftsmanship.", books),
                new Product("Designing Data-Intensive Applications", "O'Reilly", new BigDecimal("45.90"), 30,
                        "The big ideas behind reliable, scalable and maintainable systems.", books),
                new Product("Espresso Machine", "De'Longhi", new BigDecimal("279.00"), 10,
                        "Manual espresso machine with milk frother.", home),
                new Product("Cast Iron Pan 28cm", "Lodge", new BigDecimal("49.90"), 35,
                        "Pre-seasoned cast iron skillet.", home)
        ));
        log.info("Seeded demo catalog");
    }
}
