import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { api } from "./client";
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

export async function getProduct(id: number): Promise<Product> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", `product-${id}`);
  return api<Product>(`/products/product/${id}/product`);
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
