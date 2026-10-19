package dev.pioruocco.piocart.service.order;

import dev.pioruocco.piocart.dto.OrderDto;
import dev.pioruocco.piocart.dto.OrderItemDto;
import dev.pioruocco.piocart.enums.OrderStatus;
import dev.pioruocco.piocart.exceptions.InsufficientStockException;
import dev.pioruocco.piocart.exceptions.ResourceNotFoundException;
import dev.pioruocco.piocart.model.Cart;
import dev.pioruocco.piocart.model.Order;
import dev.pioruocco.piocart.model.OrderItem;
import dev.pioruocco.piocart.model.Product;
import dev.pioruocco.piocart.repository.OrderRepository;
import dev.pioruocco.piocart.repository.ProductRepository;
import dev.pioruocco.piocart.service.cart.ICartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService implements IOrderService {
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ICartService cartService;


    @Transactional
    @Override
    public Order placeOrder(Long userId) {
        Cart cart = cartService.getOrCreateCartForUser(userId);
        if (cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("The cart is empty");
        }
        Order order = createOrder(cart);
        List<OrderItem> orderItemList = createOrderItems(order, cart);
        order.setOrderItems(new HashSet<>(orderItemList));
        order.setTotalAmount(calculateTotalAmount(orderItemList));
        Order savedOrder = orderRepository.save(order);
        cartService.clearCart(cart.getId());
        return savedOrder;
    }

    private Order createOrder(Cart cart) {
        Order order = new Order();
        order.setUser(cart.getUser());
        order.setOrderStatus(OrderStatus.PENDING);
        order.setOrderDate(LocalDate.now());
        return  order;
    }

     private List<OrderItem> createOrderItems(Order order, Cart cart) {
        return  cart.getItems().stream().map(cartItem -> {
            Product product = cartItem.getProduct();
            if (cartItem.getQuantity() > product.getInventory()) {
                throw new InsufficientStockException("Only " + product.getInventory() + " left for " + product.getName());
            }
            product.setInventory(product.getInventory() - cartItem.getQuantity());
            productRepository.save(product);
            return  new OrderItem(
                    order,
                    product,
                    cartItem.getQuantity(),
                    cartItem.getUnitPrice());
        }).toList();

     }

     private BigDecimal calculateTotalAmount(List<OrderItem> orderItemList) {
        return  orderItemList
                .stream()
                .map(item -> item.getPrice()
                        .multiply(new BigDecimal(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
     }

    @Override
    public OrderDto getOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .map(this :: convertToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    // Someone else's order is reported as missing, so order ids can't be probed
    @Override
    public OrderDto getUserOrder(Long orderId, Long userId) {
        return orderRepository.findById(orderId)
                .filter(order -> order.getUser() != null && order.getUser().getId().equals(userId))
                .map(this :: convertToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    @Override
    public List<OrderDto> getUserOrders(Long userId) {
        List<Order> orders = orderRepository.findByUserId(userId);
        return  orders.stream()
                .sorted(Comparator.comparing(Order::getOrderId).reversed())
                .map(this :: convertToDto)
                .toList();
    }

    @Override
    public OrderDto convertToDto(Order order) {
        OrderDto orderDto = new OrderDto();
        orderDto.setId(order.getOrderId());
        orderDto.setUserId(order.getUser() != null ? order.getUser().getId() : null);
        orderDto.setOrderDate(order.getOrderDate());
        orderDto.setTotalAmount(order.getTotalAmount());
        orderDto.setStatus(order.getOrderStatus().name());
        orderDto.setItems(order.getOrderItems().stream().map(item -> {
            OrderItemDto itemDto = new OrderItemDto();
            itemDto.setProductId(item.getProduct().getId());
            itemDto.setProductName(item.getProduct().getName());
            itemDto.setQuantity(item.getQuantity());
            itemDto.setPrice(item.getPrice());
            return itemDto;
        }).toList());
        return orderDto;
    }
}
