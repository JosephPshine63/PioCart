package dev.pioruocco.piocart.service.order;

import dev.pioruocco.piocart.dto.OrderDto;
import dev.pioruocco.piocart.dto.OrderItemDto;
import dev.pioruocco.piocart.enums.OrderStatus;
import dev.pioruocco.piocart.exceptions.InsufficientStockException;
import dev.pioruocco.piocart.exceptions.PaymentFailedException;
import dev.pioruocco.piocart.exceptions.PaymentProviderException;
import dev.pioruocco.piocart.exceptions.ResourceNotFoundException;
import dev.pioruocco.piocart.model.Cart;
import dev.pioruocco.piocart.model.Order;
import dev.pioruocco.piocart.model.OrderItem;
import dev.pioruocco.piocart.model.Product;
import dev.pioruocco.piocart.repository.OrderRepository;
import dev.pioruocco.piocart.response.CheckoutResponse;
import dev.pioruocco.piocart.service.cart.ICartService;
import dev.pioruocco.piocart.service.payment.IPaymentService;
import dev.pioruocco.piocart.service.payment.PaymentSession;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService implements IOrderService {
    private final OrderRepository orderRepository;
    private final ICartService cartService;
    private final IPaymentService paymentService;
    private final EntityManager entityManager;

    /**
     * Snapshots the cart into a PENDING order and opens a hosted payment for it. Stock is only checked here:
     * it is decremented, and the cart emptied, once the payment is confirmed.
     */
    @Transactional
    @Override
    public CheckoutResponse checkout(Long userId) {
        Cart cart = cartService.getOrCreateCartForUser(userId);
        if (cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("The cart is empty");
        }
        List<Order> abandoned = orderRepository.findByUserIdAndOrderStatus(userId, OrderStatus.PENDING);

        Order order = createOrder(cart);
        List<OrderItem> orderItemList = createOrderItems(order, cart);
        order.setOrderItems(new HashSet<>(orderItemList));
        order.setTotalAmount(calculateTotalAmount(orderItemList));
        Order savedOrder = orderRepository.save(order);

        PaymentSession session = paymentService.createCheckoutSession(savedOrder, cart.getUser().getEmail());
        savedOrder.setPaymentSessionId(session.id());
        abandoned.forEach(this::cancelAbandonedCheckout);
        return new CheckoutResponse(savedOrder.getOrderId(), session.url());
    }

    // An earlier checkout the customer walked away from: close its payment page so it can't be paid any more
    private void cancelAbandonedCheckout(Order order) {
        if (order.getPaymentSessionId() == null) {
            return;
        }
        try {
            PaymentSession session = paymentService.getSession(order.getPaymentSessionId());
            if (session.paid()) {
                // paid but not confirmed yet: the confirmation page can still fulfil it
                return;
            }
            if ("open".equals(session.status())) {
                paymentService.expireSession(session.id());
            }
            order.setOrderStatus(OrderStatus.CANCELLED);
        } catch (PaymentProviderException e) {
            log.warn("Could not cancel abandoned checkout of order {}", order.getOrderId(), e);
        }
    }

    /**
     * Fulfils the order paid by a checkout session: decrements stock, empties the cart and moves it to PROCESSING.
     * Confirming twice returns the order unchanged. If stock ran out in the meantime the order is cancelled and
     * the payment refunded.
     */
    @Transactional(noRollbackFor = InsufficientStockException.class)
    @Override
    public Order confirmPayment(Long userId, String sessionId) {
        Order order = orderRepository.findByPaymentSessionId(sessionId)
                .filter(found -> found.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new PaymentFailedException("This checkout was cancelled");
        }
        if (order.getOrderStatus() != OrderStatus.PENDING) {
            return order;
        }

        PaymentSession session = paymentService.getSession(sessionId);
        long expected = IPaymentService.toMinorUnits(order.getTotalAmount());
        if (!session.paid()
                || session.amountTotal() == null || session.amountTotal() != expected
                || !paymentService.getCurrency().equalsIgnoreCase(session.currency())) {
            throw new PaymentFailedException("The payment was not completed");
        }

        // Lock the products (in id order, against deadlocks) so concurrent orders can't oversell
        List<Product> products = order.getOrderItems().stream()
                .map(OrderItem::getProduct)
                .distinct()
                .sorted(Comparator.comparing(Product::getId))
                .toList();
        products.forEach(product -> entityManager.refresh(product, LockModeType.PESSIMISTIC_WRITE));

        for (OrderItem item : order.getOrderItems()) {
            Product product = item.getProduct();
            if (item.getQuantity() > product.getInventory()) {
                order.setOrderStatus(OrderStatus.CANCELLED);
                paymentService.refundSession(sessionId);
                throw new InsufficientStockException("Only " + product.getInventory() + " left for " + product.getName());
            }
        }
        order.getOrderItems().forEach(item ->
                item.getProduct().setInventory(item.getProduct().getInventory() - item.getQuantity()));
        order.setOrderStatus(OrderStatus.PROCESSING);

        Cart cart = cartService.getOrCreateCartForUser(userId);
        cartService.clearCart(cart.getId());
        return order;
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
