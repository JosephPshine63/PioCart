package dev.pioruocco.piocart.service.payment;

import dev.pioruocco.piocart.model.Order;

import java.math.BigDecimal;
import java.math.RoundingMode;

public interface IPaymentService {
    /** Opens a hosted checkout for a saved order, one line per order item. */
    PaymentSession createCheckoutSession(Order order, String customerEmail);
    PaymentSession getSession(String sessionId);
    /** Closes an open, unpaid session so it can no longer be paid. */
    void expireSession(String sessionId);
    /** Refunds a paid session in full. Best effort: failures are only logged. */
    void refundSession(String sessionId);

    String getCurrency();

    static long toMinorUnits(BigDecimal amount) {
        return amount.movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }
}
