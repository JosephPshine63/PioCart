package dev.pioruocco.piocart.controller;

import dev.pioruocco.piocart.dto.OrderDto;
import dev.pioruocco.piocart.model.Order;
import dev.pioruocco.piocart.response.ApiResponse;
import dev.pioruocco.piocart.response.CheckoutResponse;
import dev.pioruocco.piocart.security.ShopUserDetails;
import dev.pioruocco.piocart.service.order.IOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("${api.prefix}/orders")
public class OrderController {
    private final IOrderService orderService;

    // Orders are only placed through a payment: checkout opens it, confirm fulfils the order once it is paid
    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse> checkout(@AuthenticationPrincipal ShopUserDetails user) {
        CheckoutResponse checkout = orderService.checkout(user.getId());
        return ResponseEntity.ok(new ApiResponse("Checkout started", checkout));
    }

    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse> confirmPayment(@AuthenticationPrincipal ShopUserDetails user,
                                                      @RequestParam String sessionId) {
        Order order = orderService.confirmPayment(user.getId(), sessionId);
        return ResponseEntity.ok(new ApiResponse("Order confirmed", orderService.convertToDto(order)));
    }

    @GetMapping("/{orderId}/order")
    public ResponseEntity<ApiResponse> getOrderById(@AuthenticationPrincipal ShopUserDetails user,
                                                    @PathVariable Long orderId) {
        OrderDto order = user.isAdmin()
                ? orderService.getOrder(orderId)
                : orderService.getUserOrder(orderId, user.getId());
        return ResponseEntity.ok(new ApiResponse("Item Order Success!", order));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse> getMyOrders(@AuthenticationPrincipal ShopUserDetails user) {
        List<OrderDto> orders = orderService.getUserOrders(user.getId());
        return ResponseEntity.ok(new ApiResponse("Item Order Success!", orders));
    }
}
