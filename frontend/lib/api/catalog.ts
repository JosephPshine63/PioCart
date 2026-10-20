import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { api, ApiError } from "./client";
import type { Category, Page, Product } from "./types";

export interface ProductQuery {
  category?: string;
  brand?: string;
  q?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export async function getProducts(query: ProductQuery = {}): Promise<Page<Product>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  return api<Page<Product>>("/products", { query: { ...query } });
}

/** The product, or null when it does not exist. */
export async function getProduct(id: number): Promise<Product | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", `product-${id}`);
  return orNull(api<Product>(`/products/product/${id}/product`));
}

export async function getBrands(): Promise<string[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  return api<string[]>("/products/brands");
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");
  return api<Category[]>("/categories/all");
}

/** The category with this exact name, or null when it does not exist. */
export async function getCategory(name: string): Promise<Category | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");
  return orNull(api<Category>(`/categories/category/by-name/${encodeURIComponent(name)}`));
}

async function orNull<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
