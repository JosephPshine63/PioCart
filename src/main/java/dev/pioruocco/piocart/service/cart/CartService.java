package dev.pioruocco.piocart.service.cart;

import dev.pioruocco.piocart.dto.CartDto;
import dev.pioruocco.piocart.dto.CartItemDto;
import dev.pioruocco.piocart.exceptions.ResourceNotFoundException;
import dev.pioruocco.piocart.model.Cart;
import dev.pioruocco.piocart.model.CartItem;
import dev.pioruocco.piocart.repository.CartRepository;
import dev.pioruocco.piocart.service.product.IProductService;
import dev.pioruocco.piocart.service.user.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;

@Service
@RequiredArgsConstructor
public class CartService implements ICartService{
    private final CartRepository cartRepository;
    private final IProductService productService;
    private final IUserService userService;

    @Override
    public Cart getCart(Long id) {
        return cartRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));
    }


    // Empties the cart but keeps it, so the user's next add reuses it
    @Transactional
    @Override
    public void clearCart(Long id) {
        Cart cart = getCart(id);
        cart.getItems().clear();
        cart.setTotalAmount(BigDecimal.ZERO);
        cartRepository.save(cart);
    }

    @Override
    public BigDecimal getTotalPrice(Long id) {
        Cart cart = getCart(id);
        return cart.getTotalAmount();
    }

    @Transactional
    @Override
    public Cart getOrCreateCartForUser(Long userId) {
        Cart cart = cartRepository.findByUserId(userId);
        if (cart != null) {
            return cart;
        }
        cart = new Cart();
        cart.setUser(userService.getUserById(userId));
        return cartRepository.save(cart);
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
