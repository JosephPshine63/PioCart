import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/api/catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProducts({ size: 1000 }), getCategories()]);
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((category) => ({
      url: `${SITE_URL}/categories/${encodeURIComponent(category.name)}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.content.map((product) => ({
      url: `${SITE_URL}/products/${product.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
