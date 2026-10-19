package dev.pioruocco.piocart.controller;

import dev.pioruocco.piocart.dto.OrderDto;
import dev.pioruocco.piocart.model.Order;
import dev.pioruocco.piocart.response.ApiResponse;
import dev.pioruocco.piocart.service.order.IOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("${api.prefix}/orders")
public class OrderController {
    private final IOrderService orderService;

    @PostMapping("/order")
    public ResponseEntity<ApiResponse> createOrder(@RequestParam Long userId) {
        Order order =  orderService.placeOrder(userId);
        return ResponseEntity.ok(new ApiResponse("Item Order Success!", orderService.convertToDto(order)));
    }

    @GetMapping("/{orderId}/order")
    public ResponseEntity<ApiResponse> getOrderById(@PathVariable Long orderId) {
        OrderDto order = orderService.getOrder(orderId);
        return ResponseEntity.ok(new ApiResponse("Item Order Success!", order));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse> getUserOrders(@PathVariable Long userId) {
        List<OrderDto> orders = orderService.getUserOrders(userId);
        return ResponseEntity.ok(new ApiResponse("Item Order Success!", orders));
    }
}
