package dev.pioruocco.piocart.repository;

import dev.pioruocco.piocart.enums.OrderStatus;
import dev.pioruocco.piocart.model.Order;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
  List<Order> findByUserIdAndPaidAtIsNotNullOrderByOrderIdDesc(Long userId);
  List<Order> findByUserIdAndOrderStatus(Long userId, OrderStatus orderStatus);
  Page<Order> findByPaidAtIsNotNull(Pageable pageable);
  Page<Order> findByPaidAtIsNotNullAndOrderStatus(OrderStatus orderStatus, Pageable pageable);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select o from Order o where o.orderId = :orderId")
  Optional<Order> findByIdForUpdate(Long orderId);

  // Locked so that two confirmations of the same payment can't both fulfil the order
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  Optional<Order> findByPaymentSessionId(String paymentSessionId);
}
