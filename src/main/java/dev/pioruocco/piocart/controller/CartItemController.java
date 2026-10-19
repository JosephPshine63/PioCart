package dev.pioruocco.piocart.controller;

import dev.pioruocco.piocart.response.ApiResponse;
import dev.pioruocco.piocart.security.ShopUserDetails;
import dev.pioruocco.piocart.service.cart.ICartItemService;
import dev.pioruocco.piocart.service.cart.ICartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("${api.prefix}/cartItems")
public class CartItemController {
    private final ICartItemService cartItemService;
    private final ICartService cartService;

    @PostMapping("/me/add")
    public ResponseEntity<ApiResponse> addItemToCart(@AuthenticationPrincipal ShopUserDetails user,
                                                     @RequestParam Long productId,
                                                     @RequestParam Integer quantity) {
        Long cartId = cartService.getOrCreateCartForUser(user.getId()).getId();
        cartItemService.addItemToCart(cartId, productId, quantity);
        return ResponseEntity.ok(new ApiResponse("Add Item Success", cartService.convertToDto(cartService.getCart(cartId))));
    }

    @DeleteMapping("/me/{productId}")
    public ResponseEntity<ApiResponse> removeItemFromCart(@AuthenticationPrincipal ShopUserDetails user,
                                                          @PathVariable Long productId) {
        Long cartId = cartService.getOrCreateCartForUser(user.getId()).getId();
        cartItemService.removeItemFromCart(cartId, productId);
        return ResponseEntity.ok(new ApiResponse("Remove Item Success", cartService.convertToDto(cartService.getCart(cartId))));
    }

    @PutMapping("/me/{productId}")
    public ResponseEntity<ApiResponse> updateItemQuantity(@AuthenticationPrincipal ShopUserDetails user,
                                                          @PathVariable Long productId,
                                                          @RequestParam Integer quantity) {
        Long cartId = cartService.getOrCreateCartForUser(user.getId()).getId();
        cartItemService.updateItemQuantity(cartId, productId, quantity);
        return ResponseEntity.ok(new ApiResponse("Update Item Success", cartService.convertToDto(cartService.getCart(cartId))));
    }
}
