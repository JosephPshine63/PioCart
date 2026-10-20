import "server-only";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api/client";
import type { Order } from "@/lib/api/types";

/** The signed-in user's paid orders, newest first. */
export async function getMyOrders(): Promise<Order[]> {
  try {
    return await api<Order[]>("/orders/me", { auth: true, cache: "no-store" });
  } catch (error) {
    // The proxy only checks that the cookie exists; an expired token ends up here.
    if (error instanceof ApiError && error.status === 401) redirect("/login?returnTo=%2Faccount%2Forders");
    throw error;
  }
}

/**
 * One of the signed-in user's orders (any order for an admin), or null if it doesn't exist or belongs to someone
 * else. `returnTo` is where to come back after logging in again.
 */
export async function getOrder(orderId: number, returnTo: string): Promise<Order | null> {
  try {
    return await api<Order>(`/orders/${orderId}/order`, { auth: true, cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      if (error.status === 404) return null;
    }
    throw error;
  }
}

export function orderItemCount(order: Order): number {
  return order.items.reduce((count, item) => count + item.quantity, 0);
}
