package dev.pioruocco.piocart.service.cart;

import dev.pioruocco.piocart.exceptions.InsufficientStockException;
import dev.pioruocco.piocart.exceptions.ResourceNotFoundException;
import dev.pioruocco.piocart.model.Cart;
import dev.pioruocco.piocart.model.CartItem;
import dev.pioruocco.piocart.model.Product;
import dev.pioruocco.piocart.repository.CartRepository;
import dev.pioruocco.piocart.service.product.IProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CartItemService  implements ICartItemService{
    private final CartRepository cartRepository;
    private final IProductService productService;
    private final ICartService cartService;

    @Transactional
    @Override
    public void addItemToCart(Long cartId, Long productId, int quantity) {
        //1. Get the cart
        //2. Get the product
        //3. Check if the product already in the cart
        //4. If Yes, then increase the quantity with the requested quantity
        //5. If No, then initiate a new CartItem entry.
        requirePositive(quantity);
        Cart cart = cartService.getCart(cartId);
        Product product = productService.getProductById(productId);
        CartItem cartItem = cart.getItems()
                .stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst().orElse(new CartItem());
        int newQuantity = cartItem.getQuantity() + quantity;
        checkStock(product, newQuantity);
        if (cartItem.getId() == null) {
            cartItem.setProduct(product);
            cartItem.setUnitPrice(product.getPrice());
        }
        cartItem.setQuantity(newQuantity);
        cartItem.setTotalPrice();
        cart.addItem(cartItem);
        cartRepository.save(cart);
    }

    @Transactional
    @Override
    public void removeItemFromCart(Long cartId, Long productId) {
        Cart cart = cartService.getCart(cartId);
        CartItem itemToRemove = getCartItem(cartId, productId);
        cart.removeItem(itemToRemove);
        cartRepository.save(cart);
    }

    @Transactional
    @Override
    public void updateItemQuantity(Long cartId, Long productId, int quantity) {
        requirePositive(quantity);
        Cart cart = cartService.getCart(cartId);
        CartItem item = getCartItem(cartId, productId);
        checkStock(item.getProduct(), quantity);
        item.setQuantity(quantity);
        item.setUnitPrice(item.getProduct().getPrice());
        item.setTotalPrice();
        cart.addItem(item);
        cartRepository.save(cart);
    }

    @Override
    public CartItem getCartItem(Long cartId, Long productId) {
        Cart cart = cartService.getCart(cartId);
        return  cart.getItems()
                .stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst().orElseThrow(() -> new ResourceNotFoundException("Item not found"));
    }

    private void requirePositive(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }
    }

    private void checkStock(Product product, int quantity) {
        if (quantity > product.getInventory()) {
            throw new InsufficientStockException("Only " + product.getInventory() + " left for " + product.getName());
        }
    }
}
