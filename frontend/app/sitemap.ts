import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/api/catalog";
import { SITE_URL } from "@/lib/site";

// No lastModified: the backend exposes no dates, and a made-up one is worse than none.
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
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
