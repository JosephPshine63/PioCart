package dev.pioruocco.piocart.repository;

import dev.pioruocco.piocart.model.Product;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public final class ProductSpecifications {

    private ProductSpecifications() {
    }

    public static Specification<Product> search(String category, String brand, String query) {
        return Specification.where(categoryNameIs(category))
                .and(brandIs(brand))
                .and(nameOrDescriptionContains(query));
    }

    private static Specification<Product> categoryNameIs(String category) {
        return (root, cq, cb) -> StringUtils.hasText(category)
                ? cb.equal(cb.lower(root.get("category").get("name")), category.toLowerCase())
                : null;
    }

    private static Specification<Product> brandIs(String brand) {
        return (root, cq, cb) -> StringUtils.hasText(brand)
                ? cb.equal(cb.lower(root.get("brand")), brand.toLowerCase())
                : null;
    }

    private static Specification<Product> nameOrDescriptionContains(String query) {
        if (!StringUtils.hasText(query)) {
            return null;
        }
        String pattern = "%" + query.toLowerCase().trim() + "%";
        return (root, cq, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), pattern),
                cb.like(cb.lower(root.get("brand")), pattern),
                cb.like(cb.lower(root.get("description")), pattern));
    }
}
