"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { api, ApiError, type ApiOptions } from "@/lib/api/client";
import type { Category, Image, Order, OrderStatus, Product } from "@/lib/api/types";
import { clearToken } from "@/lib/auth";
import {
  categorySchema,
  MAX_IMAGE_BYTES,
  productSchema,
  type AdminActionResult,
  type CategoryState,
  type ProductState,
} from "@/lib/admin-schema";

// Server Actions are public endpoints: the backend checks the ADMIN role on every call made here.

const GENERIC_ERROR = "Operazione non riuscita. Riprova tra qualche istante.";
const ORDER_STATUSES: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

/** Calls the backend as the signed-in admin; maps auth failures, returns other errors for the caller to word. */
async function adminApi<T>(path: string, init: ApiOptions, returnTo: string): Promise<T> {
  try {
    return await api<T>(path, { ...init, auth: true, cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await clearToken();
      redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
    throw error;
  }
}

function errorMessage(error: unknown, conflict?: string): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return "Non hai i permessi per questa operazione.";
    if (error.status === 404) return "L'elemento non esiste più. Ricarica la pagina.";
    if (error.status === 409 && conflict) return conflict;
    if (error.status === 400) return "Dati non validi. Controlla i campi e riprova.";
    if (error.status === 413) return "Il file è troppo grande.";
  }
  return GENERIC_ERROR;
}

function validId(id: unknown): number {
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) throw new Error("Invalid id");
  return id;
}

function catalogChanged(productId?: number) {
  updateTag("products");
  updateTag("categories");
  if (productId) updateTag(`product-${productId}`);
}

// ---- Products ----

export async function saveProduct(productId: number | null, _prev: ProductState, formData: FormData): Promise<ProductState> {
  const values = Object.fromEntries(
    (["name", "brand", "category", "price", "inventory", "description"] as const).map((key) => [
      key,
      String(formData.get(key) ?? ""),
    ]),
  );
  const parsed = productSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { category, ...fields } = parsed.data;
  const body = JSON.stringify({ ...fields, category: { name: category } });
  const id = productId === null ? null : validId(productId);
  let product: Product;
  try {
    product =
      id === null
        ? await adminApi<Product>("/products/add", { method: "POST", body }, "/admin/products/new")
        : await adminApi<Product>(`/products/product/${id}/update`, { method: "PUT", body }, `/admin/products/${id}`);
  } catch (error) {
    return { message: errorMessage(error), values };
  }

  catalogChanged(product.id);
  // A new product goes straight to its page, where images can be added
  if (id === null) redirect(`/admin/products/${product.id}`);
  return { saved: true, values };
}

/** With `backToList` (from the product's own page, which would 404 once re-rendered) it ends on the product list. */
export async function deleteProduct(productId: number, backToList = false): Promise<AdminActionResult> {
  const id = validId(productId);
  try {
    await adminApi(`/products/product/${id}/delete`, { method: "DELETE" }, "/admin/products");
  } catch (error) {
    return {
      error: errorMessage(
        error,
        "Il prodotto è già stato ordinato e non può essere eliminato: imposta la giacenza a 0 per toglierlo dalla vendita.",
      ),
    };
  }
  catalogChanged(id);
  if (backToList === true) redirect("/admin/products");
  refresh();
  return {};
}

/** Uploads one image (the client sends files one at a time to stay under the request size limit). */
export async function uploadProductImage(productId: number, formData: FormData): Promise<AdminActionResult> {
  const id = validId(productId);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Seleziona un'immagine." };
  if (!file.type.startsWith("image/") || file.type.includes("svg")) {
    return { error: `${file.name}: sono ammesse solo immagini JPEG, PNG, WebP o GIF.` };
  }
  if (file.size > MAX_IMAGE_BYTES) return { error: `${file.name}: l'immagine supera i 4 MB.` };

  const upload = new FormData();
  upload.append("files", file, file.name);
  try {
    await adminApi<Image[]>("/images/upload", { method: "POST", body: upload, query: { productId: id } }, `/admin/products/${id}`);
  } catch (error) {
    return { error: `${file.name}: ${errorMessage(error)}` };
  }
  catalogChanged(id);
  return {};
}

export async function deleteProductImage(productId: number, imageId: number): Promise<AdminActionResult> {
  const id = validId(productId);
  try {
    await adminApi(`/images/image/${validId(imageId)}/delete`, { method: "DELETE" }, `/admin/products/${id}`);
  } catch (error) {
    return { error: errorMessage(error) };
  }
  catalogChanged(id);
  refresh();
  return {};
}

// ---- Categories ----

export async function createCategory(_prev: CategoryState, formData: FormData): Promise<CategoryState> {
  return saveCategory(null, formData);
}

export async function renameCategory(categoryId: number, _prev: CategoryState, formData: FormData): Promise<CategoryState> {
  return saveCategory(validId(categoryId), formData);
}

async function saveCategory(id: number | null, formData: FormData): Promise<CategoryState> {
  const values = { name: String(formData.get("name") ?? "") };
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const body = JSON.stringify(parsed.data);
  try {
    await (id === null
      ? adminApi<Category>("/categories/add", { method: "POST", body }, "/admin/categories")
      : adminApi<Category>(`/categories/category/${id}/update`, { method: "PUT", body }, "/admin/categories"));
  } catch (error) {
    return { message: errorMessage(error, "Esiste già una categoria con questo nome."), values };
  }
  catalogChanged();
  refresh();
  // A new category clears the form; a renamed one keeps the new name
  return { saved: true, values: id === null ? { name: "" } : { name: parsed.data.name } };
}

export async function deleteCategory(categoryId: number): Promise<AdminActionResult> {
  try {
    await adminApi(`/categories/category/${validId(categoryId)}/delete`, { method: "DELETE" }, "/admin/categories");
  } catch (error) {
    return {
      error: errorMessage(error, "La categoria contiene ancora dei prodotti: spostali o eliminali prima di cancellarla."),
    };
  }
  catalogChanged();
  refresh();
  return {};
}

// ---- Orders ----

export async function updateOrderStatus(orderId: number, status: OrderStatus): Promise<AdminActionResult> {
  const id = validId(orderId);
  if (!ORDER_STATUSES.includes(status)) throw new Error("Invalid status");
  try {
    await adminApi<Order>(`/orders/${id}/status`, { method: "PUT", query: { status } }, `/admin/orders/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 502) {
      return { error: "Il rimborso su Stripe non è riuscito: l'ordine non è stato annullato. Riprova più tardi." };
    }
    return { error: errorMessage(error, "Questo cambio di stato non è più possibile: ricarica la pagina.") };
  }
  // Cancelling puts items back in stock
  if (status === "CANCELLED") catalogChanged();
  refresh();
  return {};
}
