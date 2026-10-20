import { NextResponse, type NextRequest } from "next/server";
import { api, ApiError } from "@/lib/api/client";
import type { Order } from "@/lib/api/types";
import { clearToken } from "@/lib/auth";
import type { CheckoutStatus } from "@/lib/checkout";

/**
 * Stripe's success_url. Confirms the paid order with the backend before any page renders, so the
 * success page (and the header's cart badge) already see the emptied cart.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId || !/^cs_\w+$/.test(sessionId)) return backToCheckout(request, "invalid");

  try {
    const order = await api<Order>("/orders/confirm", {
      method: "POST",
      query: { sessionId },
      auth: true,
      cache: "no-store",
    });
    return redirectTo(request, `/checkout/success?order=${order.id}`);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.status === 401) {
      // Expired session: log in again and come back here, the payment can still be confirmed
      await clearToken();
      const returnTo = request.nextUrl.pathname + request.nextUrl.search;
      return redirectTo(request, `/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
    if (error.status === 402) return backToCheckout(request, "failed");
    if (error.status === 409) return backToCheckout(request, "sold_out");
    if (error.status === 404) return backToCheckout(request, "invalid");
    return backToCheckout(request, "error");
  }
}

function backToCheckout(request: NextRequest, status: CheckoutStatus) {
  // The checkout page bounces an emptied cart to /cart, which is fine: there is nothing left to pay
  return redirectTo(request, `/checkout?status=${status}`);
}

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}
