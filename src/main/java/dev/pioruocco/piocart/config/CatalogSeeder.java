package dev.pioruocco.piocart.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.pioruocco.piocart.model.Category;
import dev.pioruocco.piocart.model.Image;
import dev.pioruocco.piocart.model.Product;
import dev.pioruocco.piocart.repository.CategoryRepository;
import dev.pioruocco.piocart.repository.ImageRepository;
import dev.pioruocco.piocart.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.sql.rowset.serial.SerialBlob;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.SQLException;
import java.time.Duration;
import java.util.List;

/**
 * Loads the demo catalog in {@code seed/catalog.json} when SEED_CATALOG=true, downloading each product photo
 * from Unsplash into the database. Products already present (same name and brand) are skipped, so it is safe
 * to leave enabled across restarts. A photo that can't be downloaded leaves its product without images.
 */
@Slf4j
@Order(0) // before DevDataSeeder, which adds its own catalog only to an empty database
@Component
@ConditionalOnProperty(name = "app.seed.catalog", havingValue = "true")
@RequiredArgsConstructor
public class CatalogSeeder implements CommandLineRunner {
    private static final String CATALOG = "seed/catalog.json";
    private static final String IMAGE_URL = "https://images.unsplash.com/photo-%s?w=1200&q=80&fm=jpg";
    private static final String DOWNLOAD_URL = "/api/v1/images/image/download/";
    private static final long MAX_IMAGE_BYTES = 5 * 1024 * 1024;

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ImageRepository imageRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.seed.catalog-images:true}")
    private boolean withImages;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    record SeedCatalog(List<SeedCategory> categories) {
    }

    record SeedCategory(String name, List<SeedProduct> products) {
    }

    record SeedProduct(String name, String brand, BigDecimal price, int inventory, String description, String image) {
    }

    @Override
    public void run(String... args) throws IOException {
        SeedCatalog catalog;
        try (InputStream in = new ClassPathResource(CATALOG).getInputStream()) {
            catalog = objectMapper.readValue(in, SeedCatalog.class);
        }
        int added = 0;
        for (SeedCategory seedCategory : catalog.categories()) {
            Category category = findOrCreateCategory(seedCategory.name());
            for (SeedProduct seed : seedCategory.products()) {
                if (productRepository.countByBrandAndName(seed.brand(), seed.name()) > 0) {
                    continue;
                }
                Product product = productRepository.save(new Product(seed.name(), seed.brand(), seed.price(),
                        seed.inventory(), seed.description(), category));
                if (withImages && StringUtils.hasText(seed.image())) {
                    saveImage(product, seed.image());
                }
                added++;
            }
        }
        if (added > 0) {
            log.info("Seeded {} catalog products", added);
        }
    }

    private Category findOrCreateCategory(String name) {
        Category category = categoryRepository.findByName(name);
        return category != null ? category : categoryRepository.save(new Category(name));
    }

    private void saveImage(Product product, String photoId) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(IMAGE_URL.formatted(photoId)))
                    .timeout(Duration.ofSeconds(30))
                    .build();
            HttpResponse<byte[]> response = http.send(request, HttpResponse.BodyHandlers.ofByteArray());
            String type = response.headers().firstValue("Content-Type").orElse("");
            byte[] bytes = response.body();
            if (response.statusCode() != 200 || !type.startsWith("image/") || type.contains("svg")
                    || bytes.length == 0 || bytes.length > MAX_IMAGE_BYTES) {
                log.warn("Skipping photo {} for '{}': status {}, type '{}', {} bytes",
                        photoId, product.getName(), response.statusCode(), type, bytes.length);
                return;
            }
            Image image = new Image();
            image.setFileName(photoId + ".jpg");
            image.setFileType(type);
            image.setImage(new SerialBlob(bytes));
            image.setProduct(product);
            Image saved = imageRepository.save(image);
            saved.setDownloadUrl(DOWNLOAD_URL + saved.getId());
            imageRepository.save(saved);
        } catch (IOException | SQLException e) {
            log.warn("Could not download photo {} for '{}': {}", photoId, product.getName(), e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Interrupted while downloading photo {}", photoId);
        }
    }
}
