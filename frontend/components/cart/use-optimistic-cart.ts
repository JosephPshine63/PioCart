"use client";

import { useOptimistic, useState, useTransition } from "react";
import { removeCartItem, updateCartItem } from "@/app/actions/cart";
import type { Cart } from "@/lib/api/types";
import { withQuantity } from "@/lib/cart";

type QuantityChange = { productId: number; quantity: number };

/**
 * Shows quantity changes and removals immediately; once the Server Action ends the cart comes
 * back from the server, or the optimistic state is dropped if it failed.
 */
export function useOptimisticCart(cart: Cart) {
  const [optimisticCart, applyChange] = useOptimistic(cart, (state, { productId, quantity }: QuantityChange) =>
    withQuantity(state, productId, quantity),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function setQuantity(productId: number, quantity: number) {
    setError(null);
    startTransition(async () => {
      applyChange({ productId, quantity });
      const result = quantity > 0 ? await updateCartItem(productId, quantity) : await removeCartItem(productId);
      if (result.error) setError(result.error);
    });
  }

  return { cart: optimisticCart, setQuantity, error, pending };
}
