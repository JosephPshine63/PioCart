import type { Cart } from "@/lib/api/types";

/** Upper bound for a single cart line, on top of the product stock. */
export const MAX_LINE_QUANTITY = 99;

export function itemCount(cart: Cart | null): number {
  return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}

/** Cart with one line set to `quantity` (0 removes it) and totals recomputed, used for optimistic updates. */
export function withQuantity(cart: Cart, productId: number, quantity: number): Cart {
  const items = cart.items
    .map((item) =>
      item.product.id === productId ? { ...item, quantity, totalPrice: item.unitPrice * quantity } : item,
    )
    .filter((item) => item.quantity > 0);
  return { ...cart, items, totalAmount: items.reduce((sum, item) => sum + item.totalPrice, 0) };
}
