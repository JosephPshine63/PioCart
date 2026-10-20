import { z } from "zod";
import type { OrderStatus } from "@/lib/api/types";
import type { FormState } from "@/lib/auth-schema";

/** Max size of one product image: the backend accepts 5MB, Vercel functions take request bodies up to 4.5MB. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

// Mirrors the backend AddProductRequest / ProductUpdateRequest constraints.
export const productSchema = z.object({
  name: z.string().trim().min(1, "Inserisci il nome").max(255, "Massimo 255 caratteri"),
  brand: z.string().trim().min(1, "Inserisci la marca").max(255, "Massimo 255 caratteri"),
  category: z.string().trim().min(1, "Inserisci la categoria").max(255, "Massimo 255 caratteri"),
  price: z
    .string()
    .trim()
    .transform((value) => value.replace(",", "."))
    .pipe(
      z
        .string()
        .regex(/^\d{1,8}(\.\d{1,2})?$/, "Prezzo non valido, ad esempio 19,90")
        .transform(Number)
        .pipe(z.number().min(0.01, "Il prezzo deve essere maggiore di zero")),
    ),
  inventory: z.coerce
    .number({ error: "Inserisci un numero" })
    .int("Inserisci un numero intero")
    .min(0, "Non può essere negativo")
    .max(1_000_000, "Valore troppo grande"),
  description: z.string().trim().max(255, "Massimo 255 caratteri"),
});

export type ProductField = keyof z.infer<typeof productSchema>;
export type ProductState = FormState<ProductField> & { saved?: boolean };

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Inserisci il nome").max(255, "Massimo 255 caratteri"),
});

export type CategoryState = FormState<"name"> & { saved?: boolean };

/** Status changes allowed from each status, as enforced by the backend (OrderService.ALLOWED_TRANSITIONS). */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export type AdminActionResult = { error?: string };
