import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog-view";
import { getCategories, getCategory } from "@/lib/api/catalog";
import { parseCatalogParams } from "@/lib/catalog-params";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ name: category.name }));
}

export async function generateMetadata({ params }: PageProps<"/categories/[name]">): Promise<Metadata> {
  const category = await getCategory(decodeURIComponent((await params).name));
  if (!category) return { title: "Categoria non trovata" };
  return {
    title: category.name,
    description: `Tutti i prodotti della categoria ${category.name} su PioCart.`,
    alternates: { canonical: `/categories/${encodeURIComponent(category.name)}` },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/categories/[name]">) {
  const category = await getCategory(decodeURIComponent((await params).name));
  if (!category) notFound();

  const pathname = `/categories/${encodeURIComponent(category.name)}`;
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-1">
        <nav aria-label="Percorso" className="text-sm text-muted-foreground">
          <Link href="/products" className="hover:text-foreground">
            Catalogo
          </Link>{" "}
          / <span className="text-foreground">{category.name}</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
      </div>
      <CatalogView pathname={pathname} params={parseCatalogParams(await searchParams)} fixedCategory={category.name} />
    </div>
  );
}
