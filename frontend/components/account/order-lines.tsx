import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import type { OrderItem } from "@/lib/api/types";
import { formatPrice, imageSrc } from "@/lib/format";

/** Read-only order lines with thumbnail, quantity and the price paid. */
export function OrderLines({ items }: { items: OrderItem[] }) {
  return (
    <ul className="divide-y">
      {items.map((item) => (
        <li key={item.productId} className="flex items-center gap-4 py-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-md border bg-muted">
            {item.imageId ? (
              <Image src={imageSrc(item.imageId)} alt="" fill sizes="64px" className="object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-muted-foreground">
                <ImageOff className="size-5" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`/products/${item.productId}`} className="line-clamp-2 font-medium leading-snug hover:underline">
              {item.productName}
            </Link>
            <p className="text-sm text-muted-foreground tabular-nums">
              {item.quantity} × {formatPrice(item.price)}
            </p>
          </div>
          <span className="shrink-0 font-semibold tabular-nums">{formatPrice(item.price * item.quantity)}</span>
        </li>
      ))}
    </ul>
  );
}
