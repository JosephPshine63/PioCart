package dev.pioruocco.piocart.controller;

import dev.pioruocco.piocart.dto.OrderDto;
import dev.pioruocco.piocart.model.Order;
import dev.pioruocco.piocart.response.ApiResponse;
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

    @PostMapping("/order")
    public ResponseEntity<ApiResponse> createOrder(@AuthenticationPrincipal ShopUserDetails user) {
        Order order = orderService.placeOrder(user.getId());
        return ResponseEntity.ok(new ApiResponse("Item Order Success!", orderService.convertToDto(order)));
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
