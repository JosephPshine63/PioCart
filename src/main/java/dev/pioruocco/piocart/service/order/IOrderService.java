package dev.pioruocco.piocart.service.order;

import dev.pioruocco.piocart.dto.OrderDto;
import dev.pioruocco.piocart.enums.OrderStatus;
import dev.pioruocco.piocart.model.Order;
import dev.pioruocco.piocart.response.CheckoutResponse;
import dev.pioruocco.piocart.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IOrderService {
    CheckoutResponse checkout(Long userId);
    Order confirmPayment(Long userId, String sessionId);
    OrderDto getOrder(Long orderId);
    OrderDto getUserOrder(Long orderId, Long userId);
    List<OrderDto> getUserOrders(Long userId);
    PageResponse<OrderDto> getPaidOrders(OrderStatus status, Pageable pageable);
    Order updateStatus(Long orderId, OrderStatus status);

    OrderDto convertToDto(Order order);
}
