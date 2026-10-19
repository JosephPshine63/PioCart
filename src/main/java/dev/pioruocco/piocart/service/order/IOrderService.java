package dev.pioruocco.piocart.service.order;

import dev.pioruocco.piocart.dto.OrderDto;
import dev.pioruocco.piocart.model.Order;

import java.util.List;

public interface IOrderService {
    Order placeOrder(Long userId);
    OrderDto getOrder(Long orderId);
    OrderDto getUserOrder(Long orderId, Long userId);
    List<OrderDto> getUserOrders(Long userId);

    OrderDto convertToDto(Order order);
}
