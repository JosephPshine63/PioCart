"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import type { Image as ProductImage } from "@/lib/api/types";
import { imageSrc } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, alt }: { images: ProductImage[]; alt: string }) {
  const [selected, setSelected] = useState(0);
  const current = images[selected];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
        {current ? (
          <Image
            src={imageSrc(current.id)}
            alt={alt}
            fill
            preload
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-12" aria-hidden />
            <span className="sr-only">Nessuna immagine disponibile</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-2">
          {images.map((image, i) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setSelected(i)}
                aria-label={`Mostra immagine ${i + 1}`}
                aria-pressed={i === selected}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-md border bg-muted",
                  i === selected ? "ring-2 ring-ring ring-offset-2" : "opacity-70 hover:opacity-100",
                )}
              >
                <Image src={imageSrc(image.id)} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
