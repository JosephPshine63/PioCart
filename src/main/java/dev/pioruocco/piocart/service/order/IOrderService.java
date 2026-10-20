package dev.pioruocco.piocart.service.order;

import dev.pioruocco.piocart.dto.OrderDto;
import dev.pioruocco.piocart.model.Order;
import dev.pioruocco.piocart.response.CheckoutResponse;

import java.util.List;

public interface IOrderService {
    CheckoutResponse checkout(Long userId);
    Order confirmPayment(Long userId, String sessionId);
    OrderDto getOrder(Long orderId);
    OrderDto getUserOrder(Long orderId, Long userId);
    List<OrderDto> getUserOrders(Long userId);

    OrderDto convertToDto(Order order);
}
