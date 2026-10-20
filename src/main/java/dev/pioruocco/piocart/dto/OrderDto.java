package dev.pioruocco.piocart.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderDto {
    private Long id;
    private Long userId;
    private String customerName;
    private String customerEmail;
    private LocalDate orderDate;
    private LocalDateTime paidAt;
    private BigDecimal totalAmount;
    private String status;
    private List<OrderItemDto> items;
}
