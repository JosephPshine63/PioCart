package dev.pioruocco.piocart.service.cart;

import dev.pioruocco.piocart.dto.CartDto;
import dev.pioruocco.piocart.dto.CartItemDto;
import dev.pioruocco.piocart.exceptions.ResourceNotFoundException;
import dev.pioruocco.piocart.model.Cart;
import dev.pioruocco.piocart.model.CartItem;
import dev.pioruocco.piocart.repository.CartItemRepository;
import dev.pioruocco.piocart.repository.CartRepository;
import dev.pioruocco.piocart.service.product.IProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;

@Service
@RequiredArgsConstructor
public class CartService implements ICartService{
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final IProductService productService;

    @Override
    public Cart getCart(Long id) {
        return cartRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));
    }


    @Transactional
    @Override
    public void clearCart(Long id) {
        Cart cart = getCart(id);
        cartItemRepository.deleteAllByCartId(id);
        cart.getItems().clear();
        cartRepository.deleteById(id);

    }

    @Override
    public BigDecimal getTotalPrice(Long id) {
        Cart cart = getCart(id);
        return cart.getTotalAmount();
    }

    @Override
    public Long initializeNewCart() {
        return cartRepository.save(new Cart()).getId();
    }

    @Override
    public Cart getCartByUserId(Long userId) {
        return cartRepository.findByUserId(userId);
    }

    @Override
    public CartDto convertToDto(Cart cart) {
        CartDto cartDto = new CartDto();
        cartDto.setCartId(cart.getId());
        cartDto.setTotalAmount(cart.getTotalAmount());
        cartDto.setItems(cart.getItems().stream()
                .sorted(Comparator.comparing(CartItem::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::convertItemToDto)
                .toList());
        return cartDto;
    }

    private CartItemDto convertItemToDto(CartItem item) {
        CartItemDto itemDto = new CartItemDto();
        itemDto.setItemId(item.getId());
        itemDto.setQuantity(item.getQuantity());
        itemDto.setUnitPrice(item.getUnitPrice());
        itemDto.setTotalPrice(item.getTotalPrice());
        itemDto.setProduct(productService.convertToDto(item.getProduct()));
        return itemDto;
    }
}
