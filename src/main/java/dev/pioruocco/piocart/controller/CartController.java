package dev.pioruocco.piocart.controller;

import dev.pioruocco.piocart.dto.CartDto;
import dev.pioruocco.piocart.model.Cart;
import dev.pioruocco.piocart.response.ApiResponse;
import dev.pioruocco.piocart.security.ShopUserDetails;
import dev.pioruocco.piocart.service.cart.ICartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("${api.prefix}/carts")
public class CartController {
    private final ICartService cartService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse> getMyCart(@AuthenticationPrincipal ShopUserDetails user) {
        CartDto cart = cartService.convertToDto(cartService.getOrCreateCartForUser(user.getId()));
        return ResponseEntity.ok(new ApiResponse("Success", cart));
    }

    @DeleteMapping("/me/clear")
    public ResponseEntity<ApiResponse> clearMyCart(@AuthenticationPrincipal ShopUserDetails user) {
        Cart cart = cartService.getOrCreateCartForUser(user.getId());
        cartService.clearCart(cart.getId());
        return ResponseEntity.ok(new ApiResponse("Clear Cart Success!", cartService.convertToDto(cart)));
    }
}
