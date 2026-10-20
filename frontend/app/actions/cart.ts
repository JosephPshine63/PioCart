"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError, type ApiOptions } from "@/lib/api/client";
import type { Cart } from "@/lib/api/types";
import { clearToken, getToken } from "@/lib/auth";
import { safeReturnTo } from "@/lib/auth-schema";
import { MAX_LINE_QUANTITY } from "@/lib/cart";

export type CartActionResult = { error?: string };

export async function addToCart(productId: number, quantity: number, returnTo: string): Promise<CartActionResult> {
  return mutateCart(
    `/cartItems/me/add`,
    { method: "POST", query: { productId: validId(productId), quantity: validQuantity(quantity) } },
    returnTo,
  );
}

export async function updateCartItem(productId: number, quantity: number): Promise<CartActionResult> {
  return mutateCart(
    `/cartItems/me/${validId(productId)}`,
    { method: "PUT", query: { quantity: validQuantity(quantity) } },
    "/cart",
  );
}

export async function removeCartItem(productId: number): Promise<CartActionResult> {
  return mutateCart(`/cartItems/me/${validId(productId)}`, { method: "DELETE" }, "/cart");
}

async function mutateCart(path: string, init: ApiOptions, returnTo: string): Promise<CartActionResult> {
  if (!(await getToken())) redirect(loginUrl(returnTo));

  try {
    await api<Cart>(path, { ...init, auth: true, cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        await clearToken();
        redirect(loginUrl(returnTo));
      }
      if (error.status === 409) return { error: "Non ci sono abbastanza pezzi disponibili per questa quantità." };
      if (error.status === 404) return { error: "Il prodotto non è più disponibile." };
    }
    return { error: "Non è stato possibile aggiornare il carrello. Riprova tra qualche istante." };
  }

  // The cart is read with no-store, so re-rendering the current route is enough to show the new state.
  refresh();
  return {};
}

function loginUrl(returnTo: string) {
  return `/login?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`;
}

// Server Actions are public endpoints: never trust the arguments sent by the client.
function validId(id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Invalid product id");
  return id;
}

function validQuantity(quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > MAX_LINE_QUANTITY) {
    throw new Error("Invalid quantity");
  }
  return quantity;
}
