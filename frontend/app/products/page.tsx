import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog-view";
import { parseCatalogParams } from "@/lib/catalog-params";
import { openGraph } from "@/lib/seo";

const DESCRIPTION =
  "Sfoglia il catalogo PioCart: elettronica, libri e casa dai migliori marchi, con filtri per categoria e marca e ordinamento per prezzo o novità.";

export async function generateMetadata({ searchParams }: PageProps<"/products">): Promise<Metadata> {
  const { q, page, category, brand } = parseCatalogParams(await searchParams);
  // A category-only filter duplicates its category page
  const canonical = category && !brand && !q ? `/categories/${encodeURIComponent(category)}` : "/products";
  return {
    title: q ? `Risultati per “${q}”` : "Catalogo",
    description: DESCRIPTION,
    alternates: { canonical },
    openGraph: openGraph({ title: "Catalogo", description: DESCRIPTION, url: "/products" }),
    // Search results and deep pages add nothing for search engines.
    robots: q || page > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const params = parseCatalogParams(await searchParams);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">
        {params.q ? `Risultati per “${params.q}”` : "Catalogo"}
      </h1>
      <CatalogView pathname="/products" params={params} />
    </div>
  );
}
