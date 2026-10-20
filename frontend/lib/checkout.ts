/** Outcomes the checkout page is sent back with, as `/checkout?status=...`. */
export const CHECKOUT_NOTICES = {
  cancelled: "Pagamento annullato. Il carrello è intatto: puoi riprovare quando vuoi.",
  failed: "Il pagamento non risulta completato. Riprova oppure usa un'altra carta.",
  sold_out:
    "Alcuni articoli si sono esauriti mentre pagavi: l'ordine è stato annullato e il pagamento rimborsato. Aggiorna il carrello e riprova.",
  invalid: "Questo pagamento non è più valido. Avvia di nuovo il checkout.",
  error: "Non è stato possibile confermare l'ordine. Riprova tra qualche istante.",
} as const;

export type CheckoutStatus = keyof typeof CHECKOUT_NOTICES;

export function checkoutNotice(status: unknown): string | null {
  return typeof status === "string" && Object.hasOwn(CHECKOUT_NOTICES, status)
    ? CHECKOUT_NOTICES[status as CheckoutStatus]
    : null;
}

// Card numbers from Stripe's test mode: https://docs.stripe.com/testing
export const TEST_CARD = "4242 4242 4242 4242";
