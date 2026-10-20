import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import type { Product } from "@/lib/api/types";
import { formatPrice, imageSrc } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const cover = product.images[0];
  return (
    <Link href={`/products/${product.id}`} className="group flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
        {cover ? (
          <Image
            src={imageSrc(cover.id)}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" aria-hidden />
          </div>
        )}
        {product.inventory === 0 && (
          <span className="absolute left-2 top-2 rounded bg-background/90 px-2 py-0.5 text-xs font-medium">
            Esaurito
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{product.brand}</span>
        <span className="font-medium leading-snug group-hover:underline">{product.name}</span>
        <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
      </div>
    </Link>
  );
}
