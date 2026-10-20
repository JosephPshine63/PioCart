import "server-only";
import { notFound, redirect } from "next/navigation";
import { api } from "@/lib/api/client";
import type { Order, OrderStatus, Page, User } from "@/lib/api/types";
import { getCurrentUser } from "@/lib/session";

/** The signed-in admin; others get a 404 so the admin area isn't advertised. The backend checks the role anyway. */
export async function requireAdmin(returnTo = "/admin"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  if (user.role !== "ADMIN") notFound();
  return user;
}

export const ADMIN_PAGE_SIZE = 20;

/** Paid orders of every customer, newest first. */
export async function getAdminOrders(status: OrderStatus | undefined, page: number): Promise<Page<Order>> {
  return api<Page<Order>>("/orders", {
    auth: true,
    cache: "no-store",
    query: { status, page: page - 1, size: ADMIN_PAGE_SIZE },
  });
}
