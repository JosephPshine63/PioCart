import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog-view";
import { parseCatalogParams } from "@/lib/catalog-params";

export async function generateMetadata({ searchParams }: PageProps<"/products">): Promise<Metadata> {
  const { q, page } = parseCatalogParams(await searchParams);
  return {
    title: q ? `Risultati per “${q}”` : "Catalogo",
    description: "Sfoglia il catalogo PioCart: filtra per categoria e marca e ordina per prezzo o novità.",
    alternates: { canonical: "/products" },
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
