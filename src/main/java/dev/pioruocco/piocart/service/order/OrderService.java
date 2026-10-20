package dev.pioruocco.piocart.service.order;

import dev.pioruocco.piocart.dto.OrderDto;
import dev.pioruocco.piocart.dto.OrderItemDto;
import dev.pioruocco.piocart.enums.OrderStatus;
import dev.pioruocco.piocart.exceptions.InsufficientStockException;
import dev.pioruocco.piocart.exceptions.InvalidOrderStatusException;
import dev.pioruocco.piocart.exceptions.PaymentFailedException;
import dev.pioruocco.piocart.exceptions.PaymentProviderException;
import dev.pioruocco.piocart.exceptions.ResourceNotFoundException;
import dev.pioruocco.piocart.model.Cart;
import dev.pioruocco.piocart.model.Order;
import dev.pioruocco.piocart.model.OrderItem;
import dev.pioruocco.piocart.model.Image;
import dev.pioruocco.piocart.model.Product;
import dev.pioruocco.piocart.repository.ImageRepository;
import dev.pioruocco.piocart.repository.OrderRepository;
import dev.pioruocco.piocart.response.CheckoutResponse;
import dev.pioruocco.piocart.response.PageResponse;
import dev.pioruocco.piocart.service.cart.ICartService;
import dev.pioruocco.piocart.service.payment.IPaymentService;
import dev.pioruocco.piocart.service.payment.PaymentSession;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService implements IOrderService {
    private final OrderRepository orderRepository;
    private final ImageRepository imageRepository;
    private final ICartService cartService;
    private final IPaymentService paymentService;
    private final EntityManager entityManager;

    // Status changes an admin can make; PENDING orders only move through checkout and payment
    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED_TRANSITIONS = Map.of(
            OrderStatus.PROCESSING, Set.of(OrderStatus.SHIPPED, OrderStatus.CANCELLED),
            OrderStatus.SHIPPED, Set.of(OrderStatus.DELIVERED));

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
        order.setPaidAt(LocalDateTime.now());

        lockProducts(order);
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

    @Override
    public PageResponse<OrderDto> getPaidOrders(OrderStatus status, Pageable pageable) {
        return PageResponse.of(
                status == null
                        ? orderRepository.findByPaidAtIsNotNull(pageable)
                        : orderRepository.findByPaidAtIsNotNullAndOrderStatus(status, pageable),
                this::convertToDto);
    }

    /**
     * Moves a paid order along PROCESSING → SHIPPED → DELIVERED. Cancelling an order that hasn't shipped yet
     * refunds the payment and puts its items back in stock.
     */
    @Transactional
    @Override
    public Order updateStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (order.getOrderStatus() == status) {
            return order;
        }
        if (!ALLOWED_TRANSITIONS.getOrDefault(order.getOrderStatus(), Set.of()).contains(status)) {
            throw new InvalidOrderStatusException(
                    "An order can't go from " + order.getOrderStatus() + " to " + status);
        }
        if (status == OrderStatus.CANCELLED) {
            lockProducts(order);
            order.getOrderItems().forEach(item ->
                    item.getProduct().setInventory(item.getProduct().getInventory() + item.getQuantity()));
            paymentService.refundSession(order.getPaymentSessionId());
        }
        order.setOrderStatus(status);
        return order;
    }

    // Lock the order's products (in id order, against deadlocks) so concurrent stock changes can't interleave
    private void lockProducts(Order order) {
        order.getOrderItems().stream()
                .map(OrderItem::getProduct)
                .distinct()
                .sorted(Comparator.comparing(Product::getId))
                .forEach(product -> entityManager.refresh(product, LockModeType.PESSIMISTIC_WRITE));
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

    // Only paid orders: checkouts that were abandoned before paying aren't part of the history
    @Override
    public List<OrderDto> getUserOrders(Long userId) {
        return orderRepository.findByUserIdAndPaidAtIsNotNullOrderByOrderIdDesc(userId).stream()
                .map(this :: convertToDto)
                .toList();
    }

    @Override
    public OrderDto convertToDto(Order order) {
        OrderDto orderDto = new OrderDto();
        orderDto.setId(order.getOrderId());
        if (order.getUser() != null) {
            orderDto.setUserId(order.getUser().getId());
            orderDto.setCustomerName(order.getUser().getFirstName() + " " + order.getUser().getLastName());
            orderDto.setCustomerEmail(order.getUser().getEmail());
        }
        orderDto.setOrderDate(order.getOrderDate());
        orderDto.setPaidAt(order.getPaidAt());
        orderDto.setTotalAmount(order.getTotalAmount());
        orderDto.setStatus(order.getOrderStatus().name());
        orderDto.setItems(order.getOrderItems().stream()
                .sorted(Comparator.comparing((OrderItem item) -> item.getProduct().getName()))
                .map(item -> {
                    OrderItemDto itemDto = new OrderItemDto();
                    itemDto.setProductId(item.getProduct().getId());
                    itemDto.setProductName(item.getProduct().getName());
                    itemDto.setImageId(imageRepository.findFirstByProductIdOrderByIdAsc(item.getProduct().getId())
                            .map(Image::getId)
                            .orElse(null));
                    itemDto.setQuantity(item.getQuantity());
                    itemDto.setPrice(item.getPrice());
                    return itemDto;
                }).toList());
        return orderDto;
    }
}
