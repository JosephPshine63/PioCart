package dev.pioruocco.piocart.controller;

import dev.pioruocco.piocart.response.ApiResponse;
import dev.pioruocco.piocart.service.cart.ICartItemService;
import dev.pioruocco.piocart.service.cart.ICartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("${api.prefix}/cartItems")
public class CartItemController {
    private final ICartItemService cartItemService;
    private final ICartService cartService;


    @PostMapping("/item/add")
    public ResponseEntity<ApiResponse> addItemToCart(@RequestParam(required = false) Long cartId,
                                                     @RequestParam Long productId,
                                                     @RequestParam Integer quantity) {
        if (cartId == null) {
            cartId = cartService.initializeNewCart();
        }
        cartItemService.addItemToCart(cartId, productId, quantity);
        return ResponseEntity.ok(new ApiResponse("Add Item Success", cartService.convertToDto(cartService.getCart(cartId))));
    }

    @DeleteMapping("/cart/{cartId}/product/{productId}/remove")
    public ResponseEntity<ApiResponse> removeItemFromCart(@PathVariable Long cartId, @PathVariable Long productId) {
        cartItemService.removeItemFromCart(cartId, productId);
        return ResponseEntity.ok(new ApiResponse("Remove Item Success", cartService.convertToDto(cartService.getCart(cartId))));
    }

    @PutMapping("/cart/{cartId}/product/{productId}/update")
    public  ResponseEntity<ApiResponse> updateItemQuantity(@PathVariable Long cartId,
                                                           @PathVariable Long productId,
                                                           @RequestParam Integer quantity) {
        cartItemService.updateItemQuantity(cartId, productId, quantity);
        return ResponseEntity.ok(new ApiResponse("Update Item Success", cartService.convertToDto(cartService.getCart(cartId))));
    }
}
