package dev.pioruocco.piocart.response;

/** A started checkout: the PENDING order and the hosted payment page to send the customer to. */
public record CheckoutResponse(Long orderId, String paymentUrl) {
}
