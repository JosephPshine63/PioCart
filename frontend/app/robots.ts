import type { MetadataRoute } from "next";
import { isIndexable, SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!isIndexable) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/account", "/checkout", "/admin", "/cart", "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
