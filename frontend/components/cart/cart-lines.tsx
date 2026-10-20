"use client";

import Image from "next/image";
import Link from "next/link";
import { CircleAlert, ImageOff, ShoppingBag, Trash2 } from "lucide-react";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Button } from "@/components/ui/button";
import type { CartItem } from "@/lib/api/types";
import { MAX_LINE_QUANTITY } from "@/lib/cart";
import { formatPrice, imageSrc } from "@/lib/format";

type CartLinesProps = {
  items: CartItem[];
  onQuantityChange: (productId: number, quantity: number) => void;
  /** Called when a product link is followed, e.g. to close the sheet. */
  onNavigate?: () => void;
};

export function CartLines({ items, onQuantityChange, onNavigate }: CartLinesProps) {
  return (
    <ul className="divide-y">
      {items.map((item) => (
        <CartLine key={item.product.id} item={item} onQuantityChange={onQuantityChange} onNavigate={onNavigate} />
      ))}
    </ul>
  );
}

function CartLine({
  item,
  onQuantityChange,
  onNavigate,
}: { item: CartItem } & Omit<CartLinesProps, "items">) {
  const { product } = item;
  const cover = product.images[0];
  const href = `/products/${product.id}`;

  return (
    <li className="flex gap-4 py-4">
      <Link
        href={href}
        onClick={onNavigate}
        tabIndex={-1}
        aria-hidden
        className="relative size-20 shrink-0 overflow-hidden rounded-md border bg-muted"
      >
        {cover ? (
          <Image src={imageSrc(cover.id)} alt="" fill sizes="80px" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-5" />
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="block text-xs uppercase tracking-wide text-muted-foreground">{product.brand}</span>
            <Link href={href} onClick={onNavigate} className="line-clamp-2 font-medium leading-snug hover:underline">
              {product.name}
            </Link>
          </div>
          <span className="shrink-0 font-semibold tabular-nums">{formatPrice(item.totalPrice)}</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <QuantityStepper
            value={item.quantity}
            max={Math.min(product.inventory, MAX_LINE_QUANTITY)}
            onChange={(quantity) => onQuantityChange(product.id, quantity)}
            label={product.name}
          />
          <div className="flex items-center gap-1">
            {item.quantity > 1 && (
              <span className="text-xs text-muted-foreground tabular-nums">{formatPrice(item.unitPrice)} cad.</span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Rimuovi ${product.name}`}
              onClick={() => onQuantityChange(product.id, 0)}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}

export function CartError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      {message}
    </div>
  );
}

export function EmptyCart({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted">
        <ShoppingBag className="size-6 text-muted-foreground" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-medium">Il carrello è vuoto</p>
        <p className="text-sm text-muted-foreground">Aggiungi qualche prodotto dal catalogo.</p>
      </div>
      <Button asChild variant="outline">
        <Link href="/products" onClick={onNavigate}>
          Sfoglia il catalogo
        </Link>
      </Button>
    </div>
  );
}
