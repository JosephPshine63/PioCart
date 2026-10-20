package dev.pioruocco.piocart;

import dev.pioruocco.piocart.config.CatalogSeeder;
import dev.pioruocco.piocart.repository.CategoryRepository;
import dev.pioruocco.piocart.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Photos are not downloaded here so the build never depends on Unsplash
@TestPropertySource(properties = {
        "app.seed.catalog=true",
        "app.seed.catalog-images=false"
})
class CatalogSeederIntegrationTest extends AbstractIntegrationTest {
    @Autowired
    private CatalogSeeder catalogSeeder;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CategoryRepository categoryRepository;

    @Test
    void seedsTheCatalogOnStartupAndSkipsExistingProducts() throws Exception {
        assertThat(categoryRepository.existsByName("Elettronica")).isTrue();
        mockMvc.perform(get("/api/v1/products").param("category", "Informatica").param("brand", "Keychron"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].name").value("Tastiera meccanica K2"));

        long products = productRepository.count();
        catalogSeeder.run();
        assertThat(productRepository.count()).isEqualTo(products);
    }
}
