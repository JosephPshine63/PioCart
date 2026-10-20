"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { LoaderCircle, ShoppingBag } from "lucide-react";
import { addToCart } from "@/app/actions/cart";
import { CartError } from "@/components/cart/cart-lines";
import { useCartSheet } from "@/components/cart/cart-sheet-context";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Button } from "@/components/ui/button";
import { MAX_LINE_QUANTITY } from "@/lib/cart";

type AddToCartProps = { productId: number; productName: string; inventory: number };

export function AddToCart({ productId, productName, inventory }: AddToCartProps) {
  const pathname = usePathname();
  const { setOpen } = useCartSheet();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const max = Math.min(inventory, MAX_LINE_QUANTITY);

  if (inventory <= 0) {
    return (
      <Button size="lg" disabled className="w-full sm:w-fit">
        <ShoppingBag />
        Non disponibile
      </Button>
    );
  }

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      // Signed-out users are redirected to the login by the action and come back here.
      const result = await addToCart(productId, quantity, pathname);
      if (result.error) {
        setError(result.error);
        return;
      }
      setQuantity(1);
      setOpen(true);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper value={quantity} max={max} onChange={setQuantity} label={productName} disabled={pending} />
        <Button size="lg" onClick={handleAdd} disabled={pending} className="flex-1 sm:flex-none">
          {pending ? <LoaderCircle className="animate-spin" /> : <ShoppingBag />}
          Aggiungi al carrello
        </Button>
      </div>
      <CartError message={error} />
    </div>
  );
}
