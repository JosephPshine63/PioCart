"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type CartSheetState = { open: boolean; setOpen: (open: boolean) => void };

const CartSheetContext = createContext<CartSheetState | null>(null);

/** Lets any page (e.g. the add to cart button) open the cart sheet that lives in the header. */
export function CartSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <CartSheetContext value={{ open, setOpen }}>{children}</CartSheetContext>;
}

export function useCartSheet(): CartSheetState {
  const context = useContext(CartSheetContext);
  if (!context) throw new Error("useCartSheet must be used inside CartSheetProvider");
  return context;
}
