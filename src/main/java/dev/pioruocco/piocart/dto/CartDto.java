package dev.pioruocco.piocart.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CartDto {
    private Long cartId;
    private List<CartItemDto> items;
    private BigDecimal totalAmount;
}
