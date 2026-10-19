package dev.pioruocco.piocart.service.cart;

import dev.pioruocco.piocart.dto.CartDto;
import dev.pioruocco.piocart.model.Cart;

import java.math.BigDecimal;

public interface ICartService {
    Cart getCart(Long id);
    void clearCart(Long id);
    BigDecimal getTotalPrice(Long id);

    Long initializeNewCart();

    Cart getCartByUserId(Long userId);

    CartDto convertToDto(Cart cart);
}
