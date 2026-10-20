package dev.pioruocco.piocart.service.payment;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Refund;
import com.stripe.model.checkout.Session;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import dev.pioruocco.piocart.exceptions.PaymentProviderException;
import dev.pioruocco.piocart.model.Order;
import dev.pioruocco.piocart.model.OrderItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Comparator;

@Slf4j
@Service
public class StripePaymentService implements IPaymentService {

    private final String apiKey;
    private final String frontendUrl;
    private final String currency;

    public StripePaymentService(@Value("${stripe.api.key}") String apiKey,
                                @Value("${app.frontend.url}") String frontendUrl,
                                @Value("${stripe.currency}") String currency) {
        this.apiKey = apiKey;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
        this.currency = currency;
    }

    @Override
    public PaymentSession createCheckoutSession(Order order, String customerEmail) {
        SessionCreateParams.Builder params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                // cards only: they are settled before the redirect, so confirmPayment sees them as paid right away
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setClientReferenceId(order.getOrderId().toString())
                .putMetadata("orderId", order.getOrderId().toString())
                .setCustomerEmail(customerEmail)
                // the storefront confirms the order from this page, see OrderService.confirmPayment
                .setSuccessUrl(frontendUrl + "/checkout/confirm?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendUrl + "/checkout?status=cancelled");

        order.getOrderItems().stream()
                .sorted(Comparator.comparing(item -> item.getProduct().getId()))
                .forEach(item -> params.addLineItem(lineItem(item)));

        return call(() -> toPaymentSession(Session.create(params.build())));
    }

    private SessionCreateParams.LineItem lineItem(OrderItem item) {
        return SessionCreateParams.LineItem.builder()
                .setQuantity((long) item.getQuantity())
                .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                        .setCurrency(currency)
                        .setUnitAmount(IPaymentService.toMinorUnits(item.getPrice()))
                        .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                .setName(item.getProduct().getName())
                                .build())
                        .build())
                .build();
    }

    @Override
    public PaymentSession getSession(String sessionId) {
        return call(() -> toPaymentSession(Session.retrieve(sessionId)));
    }

    @Override
    public void expireSession(String sessionId) {
        call(() -> Session.retrieve(sessionId).expire());
    }

    @Override
    public void refundSession(String sessionId) {
        try {
            call(() -> Refund.create(RefundCreateParams.builder()
                    .setPaymentIntent(Session.retrieve(sessionId).getPaymentIntent())
                    .build()));
        } catch (PaymentProviderException e) {
            log.error("Could not refund checkout session {}, refund it from the Stripe dashboard", sessionId, e);
        }
    }

    @Override
    public String getCurrency() {
        return currency;
    }

    private static PaymentSession toPaymentSession(Session session) {
        return new PaymentSession(session.getId(), session.getUrl(), session.getStatus(), "paid".equals(session.getPaymentStatus()),
                session.getAmountTotal(), session.getCurrency());
    }

    private <T> T call(StripeCall<T> call) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new PaymentProviderException("Payments are not configured");
        }
        Stripe.apiKey = apiKey;
        try {
            return call.run();
        } catch (StripeException e) {
            throw new PaymentProviderException("The payment provider could not process the request", e);
        }
    }

    @FunctionalInterface
    private interface StripeCall<T> {
        T run() throws StripeException;
    }
}
