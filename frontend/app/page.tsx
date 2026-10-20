import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getCategories, getProducts } from "@/lib/api/catalog";

export default async function HomePage() {
  const [latest, categories] = await Promise.all([getProducts({ size: 8 }), getCategories()]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10">
      <section className="flex flex-col gap-4 rounded-2xl bg-muted px-6 py-12 sm:px-10">
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          Tutto quello che ti serve, in un unico carrello.
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
              className="inline-flex h-10 items-center rounded-md border bg-background px-4 text-sm hover:bg-accent"
            >
              {category.name}
            </Link>
          ))}
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
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {latest.content.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
