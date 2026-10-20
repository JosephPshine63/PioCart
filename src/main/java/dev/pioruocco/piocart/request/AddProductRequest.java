package dev.pioruocco.piocart.request;

import dev.pioruocco.piocart.model.Category;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AddProductRequest {
    private Long id;
    @NotBlank
    @Size(max = 255)
    private String name;
    @NotBlank
    @Size(max = 255)
    private String brand;
    @NotNull
    @DecimalMin("0.01")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal price;
    @Min(0)
    private int inventory;
    @Size(max = 255)
    private String description;
    /** Only the name is used: the category is created if it doesn't exist yet. */
    @NotNull
    private Category category;
}
