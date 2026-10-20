"use server";

import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import type { CheckoutResponse } from "@/lib/api/types";
import { clearToken, getToken } from "@/lib/auth";

export type CheckoutState = { error?: string };

const LOGIN_URL = `/login?returnTo=${encodeURIComponent("/checkout")}`;

/** Opens a Stripe Checkout session for the current cart and sends the browser to it. */
export async function startCheckout(): Promise<CheckoutState> {
  if (!(await getToken())) redirect(LOGIN_URL);

  let paymentUrl: string;
  try {
    ({ paymentUrl } = await api<CheckoutResponse>("/orders/checkout", {
      method: "POST",
      auth: true,
      cache: "no-store",
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        await clearToken();
        redirect(LOGIN_URL);
      }
      if (error.status === 400) return { error: "Il carrello è vuoto." };
      if (error.status === 409) {
        return { error: "Alcuni articoli non sono più disponibili nella quantità scelta. Aggiorna il carrello e riprova." };
      }
    }
    return { error: "Il pagamento non è disponibile al momento. Riprova tra qualche istante." };
  }

  // Only ever leave the site for the payment page the backend created
  if (!URL.canParse(paymentUrl) || new URL(paymentUrl).protocol !== "https:") {
    return { error: "Il pagamento non è disponibile al momento. Riprova tra qualche istante." };
  }
  redirect(paymentUrl);
}
