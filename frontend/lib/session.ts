import "server-only";
import { api, ApiError } from "@/lib/api/client";
import type { Cart, User } from "@/lib/api/types";
import { getToken } from "@/lib/auth";

/** The logged-in user, or null when there is no token or it is no longer valid. */
export async function getCurrentUser(): Promise<User | null> {
  if (!(await getToken())) return null;
  try {
    return await api<User>("/auth/me", { auth: true, cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
    throw error;
  }
}

export async function getCart(): Promise<Cart | null> {
  if (!(await getToken())) return null;
  try {
    return await api<Cart>("/carts/me", { auth: true, cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
    throw error;
  }
}
