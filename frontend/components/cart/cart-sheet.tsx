"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { CartError, CartLines, EmptyCart } from "@/components/cart/cart-lines";
import { useCartSheet } from "@/components/cart/cart-sheet-context";
import { useOptimisticCart } from "@/components/cart/use-optimistic-cart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Cart } from "@/lib/api/types";
import { itemCount } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

export function CartSheet({ cart: serverCart }: { cart: Cart }) {
  const { open, setOpen } = useCartSheet();
  const { cart, setQuantity, error } = useOptimisticCart(serverCart);
  const count = itemCount(cart);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <CartIconButton count={count} />
      </SheetTrigger>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Carrello</SheetTitle>
          <SheetDescription>
            {count === 0 ? "Nessun articolo" : `${count} ${count === 1 ? "articolo" : "articoli"}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {cart.items.length === 0 ? (
            <EmptyCart onNavigate={close} />
          ) : (
            <CartLines items={cart.items} onQuantityChange={setQuantity} onNavigate={close} />
          )}
        </div>

        {cart.items.length > 0 && (
          <SheetFooter className="border-t">
            <CartError message={error} />
            <div className="flex items-center justify-between font-medium">
              <span>Subtotale</span>
              <span className="tabular-nums">{formatPrice(cart.totalAmount)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Spedizione gratuita.</p>
            <Separator className="my-1" />
            <Button asChild size="lg">
              <Link href="/cart" onClick={close}>
                Vai al carrello
              </Link>
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

type CartIconButtonProps = { count: number; href?: string } & ComponentProps<typeof Button>;

/** Header cart button: a link when `href` is set, otherwise a button (the sheet trigger). */
export function CartIconButton({ count, href, ...props }: CartIconButtonProps) {
  const label = `Carrello, ${count} ${count === 1 ? "articolo" : "articoli"}`;
  const content = (
    <>
      <ShoppingBag className="size-5" />
      {count > 0 && <Badge className="absolute -right-1 -top-1 h-5 min-w-5 px-1 tabular-nums">{count}</Badge>}
    </>
  );

  if (href) {
    return (
      <Button variant="ghost" size="icon-lg" className="relative" asChild>
        <Link href={href} aria-label={label}>
          {content}
        </Link>
      </Button>
    );
  }
  return (
    <Button variant="ghost" size="icon-lg" className="relative" aria-label={label} {...props}>
      {content}
    </Button>
  );
}
