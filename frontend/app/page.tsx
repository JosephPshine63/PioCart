import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/product-grid";
import { getCategories, getProducts } from "@/lib/api/catalog";

export default async function HomePage() {
  const [latest, categories] = await Promise.all([getProducts({ size: 8 }), getCategories()]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10">
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
