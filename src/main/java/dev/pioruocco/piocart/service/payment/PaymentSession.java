package dev.pioruocco.piocart.service.payment;

/**
 * A hosted checkout session at the payment provider.
 *
 * @param status      {@code open}, {@code complete} or {@code expired}
 * @param amountTotal amount charged, in the smallest currency unit (cents)
 */
public record PaymentSession(String id, String url, String status, boolean paid, Long amountTotal, String currency) {
}
