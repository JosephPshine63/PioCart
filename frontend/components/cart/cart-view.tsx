"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CartError, CartLines, EmptyCart } from "@/components/cart/cart-lines";
import { useOptimisticCart } from "@/components/cart/use-optimistic-cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Cart } from "@/lib/api/types";
import { itemCount } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

/** Full-page cart: editable lines plus the order summary. */
export function CartView({ cart: serverCart }: { cart: Cart }) {
  const { cart, setQuantity, error } = useOptimisticCart(serverCart);
  const count = itemCount(cart);

  if (cart.items.length === 0) {
    return (
      <div className="rounded-lg border">
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-4">
        <CartError message={error} />
        <div className="rounded-lg border px-4">
          <CartLines items={cart.items} onQuantityChange={setQuantity} />
        </div>
        <Link
          href="/products"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Continua lo shopping
        </Link>
      </div>

      <Card className="lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle>Riepilogo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Articoli ({count})
            </span>
            <span className="tabular-nums">{formatPrice(cart.totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Spedizione</span>
            <span>Gratuita</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>Totale</span>
            <span className="tabular-nums">{formatPrice(cart.totalAmount)}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild size="lg" className="w-full">
            <Link href="/checkout">Procedi al checkout</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
