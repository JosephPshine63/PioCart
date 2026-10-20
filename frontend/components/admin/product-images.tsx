"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { deleteProductImage, uploadProductImage } from "@/app/actions/admin";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { FormMessage } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import type { Image as ProductImage } from "@/lib/api/types";
import { MAX_IMAGE_BYTES } from "@/lib/admin-schema";
import { imageSrc } from "@/lib/format";

const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif,image/avif";

export function ProductImages({ productId, images }: { productId: number; images: ProductImage[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState<string>();
  const [pending, startTransition] = useTransition();

  function upload(files: File[]) {
    const failed: string[] = [];
    const accepted = files.filter((file) => {
      if (file.size > MAX_IMAGE_BYTES) failed.push(`${file.name}: l'immagine supera i 4 MB.`);
      return file.size <= MAX_IMAGE_BYTES;
    });
    setErrors(failed);
    if (accepted.length === 0) return;

    startTransition(async () => {
      // One request per file keeps every request under the size limit
      for (const [index, file] of accepted.entries()) {
        setProgress(`Caricamento ${index + 1} di ${accepted.length}…`);
        const data = new FormData();
        data.append("file", file);
        const result = await uploadProductImage(productId, data);
        if (result.error) failed.push(result.error);
      }
      setErrors([...failed]);
      setProgress(undefined);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {errors.map((error) => (
        <FormMessage key={error} message={error} />
      ))}

      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessuna immagine: nel catalogo verrà mostrato un segnaposto.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <Image src={imageSrc(image.id)} alt={image.fileName} fill sizes="200px" className="object-cover" />
              {index === 0 && (
                <span className="absolute left-2 top-2 rounded bg-background/90 px-1.5 py-0.5 text-xs font-medium">
                  Copertina
                </span>
              )}
              <ConfirmButton
                title="Eliminare questa immagine?"
                description={image.fileName}
                confirmLabel="Elimina"
                action={() => deleteProductImage(productId, image.id)}
              >
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="absolute right-2 top-2"
                  aria-label={`Elimina ${image.fileName}`}
                >
                  <Trash2 />
                </Button>
              </ConfirmButton>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={input}
          type="file"
          accept={ACCEPTED}
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            upload(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
        <Button type="button" variant="outline" onClick={() => input.current?.click()} disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}
          Aggiungi immagini
        </Button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {progress ?? "JPEG, PNG, WebP, GIF o AVIF, massimo 4 MB ciascuna. La prima è la copertina."}
        </span>
      </div>
    </div>
  );
}
