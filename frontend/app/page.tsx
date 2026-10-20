import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Info } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { ProductGrid } from "@/components/product-grid";
import { getCategories, getProducts } from "@/lib/api/catalog";
import { absoluteUrl, openGraph, personJsonLd } from "@/lib/seo";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

const TITLE = "PioCart: elettronica, libri e casa in un unico carrello";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: openGraph({ title: TITLE, description: SITE_DESCRIPTION, url: "/" }),
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: absoluteUrl("/"),
  inLanguage: "it-IT",
  description: SITE_DESCRIPTION,
  author: personJsonLd(),
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/products")}?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export default async function HomePage() {
  const [latest, categories] = await Promise.all([getProducts({ size: 8 }), getCategories()]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10">
      <JsonLd data={websiteJsonLd} />
      <div className="flex flex-col gap-3">
        <section className="relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/20 via-brand/5 to-background px-6 py-12 sm:px-10 sm:py-16">
          <Image
            src="/brand/logo-mark.png"
            alt=""
            width={371}
            height={221}
            className="pointer-events-none absolute -right-10 -bottom-8 hidden w-80 opacity-15 select-none md:block lg:w-96"
          />
          <div className="relative flex flex-col gap-4">
            <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Tutto quello che ti serve, in un <span className="text-primary">unico carrello</span>.
            </h1>
            <p className="max-w-xl text-muted-foreground">
              Elettronica, libri e casa dai migliori marchi. Sfoglia il catalogo e ordina in pochi clic.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/products"
                className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Vai al catalogo
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${encodeURIComponent(category.name)}`}
                  className="inline-flex h-10 items-center rounded-md border bg-background/80 px-4 text-sm hover:border-primary/40 hover:bg-accent"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
        <p className="flex items-start gap-2 rounded-lg border px-4 py-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            Negozio dimostrativo: i pagamenti sono in modalità test e nessun ordine viene spedito.{" "}
            <Link href="/about" className="font-medium text-foreground underline-offset-4 hover:underline">
              Scopri il progetto →
            </Link>
          </span>
        </p>
      </div>

      <section className="flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Ultimi arrivi</h2>
          <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
            Vedi tutti
          </Link>
        </div>
        {latest.content.length === 0 ? (
          <p className="text-muted-foreground">Nessun prodotto disponibile al momento.</p>
        ) : (
          <ProductGrid products={latest.content} />
        )}
      </section>
    </div>
  );
}
