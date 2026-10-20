package dev.pioruocco.piocart.repository;

import dev.pioruocco.piocart.enums.OrderStatus;
import dev.pioruocco.piocart.model.Order;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
  List<Order> findByUserId(Long userId);
  List<Order> findByUserIdAndOrderStatus(Long userId, OrderStatus orderStatus);

  // Locked so that two confirmations of the same payment can't both fulfil the order
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  Optional<Order> findByPaymentSessionId(String paymentSessionId);
}
