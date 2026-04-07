package dev.pioruocco.piocart.dto;

import dev.pioruocco.piocart.model.Cart;
import dev.pioruocco.piocart.model.Order;
import lombok.Data;

import java.util.List;

@Data
public class UserDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private List<OrderDto> orders;
    private CartDto cart;
}
