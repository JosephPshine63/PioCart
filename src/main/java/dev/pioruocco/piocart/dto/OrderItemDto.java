package dev.pioruocco.piocart.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class OrderItemDto {
    private Long productId;
    private String productName;
    /** First image of the product, if it has any. */
    private Long imageId;
    private int quantity;
    private BigDecimal price;
}
