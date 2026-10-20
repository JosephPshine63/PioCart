import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/cart/add-to-cart";
import { JsonLd } from "@/components/json-ld";
import { ProductGallery } from "@/components/product-gallery";
import { ProductGrid } from "@/components/product-grid";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getProduct, getProducts } from "@/lib/api/catalog";
import type { Product } from "@/lib/api/types";
import { formatPrice, imageSrc } from "@/lib/format";
import { absoluteUrl, breadcrumbJsonLd, openGraph, truncate } from "@/lib/seo";

const LOW_STOCK = 5;

export async function generateStaticParams() {
  const { content } = await getProducts({ size: 50 });
  return content.map((product) => ({ id: String(product.id) }));
}

async function loadProduct(params: PageProps<"/products/[id]">["params"]): Promise<Product | null> {
  const { id } = await params;
  return /^\d+$/.test(id) ? getProduct(Number(id)) : null;
}

export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  const product = await loadProduct(params);
  if (!product) return { title: "Prodotto non trovato", robots: { index: false } };

  const cover = product.images[0];
  const description = truncate(
    `${product.brand} ${product.name}: ${product.description} Scopri prezzo e disponibilità su PioCart.`,
  );
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.id}` },
    openGraph: openGraph({
      title: product.name,
      description,
      url: `/products/${product.id}`,
      // Without photos the page keeps the site's card
      ...(cover && { images: [{ url: imageSrc(cover.id), alt: product.name }] }),
    }),
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  const product = await loadProduct(params);
  if (!product) notFound();

  const related = await getProducts({ category: product.category.name, size: 5 });
  const others = related.content.filter((p) => p.id !== product.id).slice(0, 4);
  const url = absoluteUrl(`/products/${product.id}`);
  const categoryPath = `/categories/${encodeURIComponent(product.category.name)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: String(product.id),
    url,
    brand: { "@type": "Brand", name: product.brand },
    category: product.category.name,
    image: product.images.length ? product.images.map((image) => absoluteUrl(imageSrc(image.id))) : undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "EUR",
      availability: `https://schema.org/${product.inventory > 0 ? "InStock" : "OutOfStock"}`,
      itemCondition: "https://schema.org/NewCondition",
      url,
    },
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-10">
      <JsonLd data={jsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Catalogo", path: "/products" },
          { name: product.category.name, path: categoryPath },
          { name: product.name, path: `/products/${product.id}` },
        ])}
      />

      <nav aria-label="Percorso" className="text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-foreground">
          Catalogo
        </Link>{" "}
        /{" "}
        <Link href={categoryPath} className="hover:text-foreground">
          {product.category.name}
        </Link>{" "}
        / <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} alt={product.name} />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Link
              href={`/products?brand=${encodeURIComponent(product.brand)}`}
              className="text-sm uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
              {product.brand}
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-2xl font-semibold">{formatPrice(product.price)}</p>
          </div>

          <Availability inventory={product.inventory} />

          <AddToCart productId={product.id} productName={product.name} inventory={product.inventory} />

          <Separator />

          <div className="flex flex-col gap-2">
            <h2 className="font-medium">Descrizione</h2>
            <p className="leading-relaxed text-muted-foreground">{product.description}</p>
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-semibold tracking-tight">Altri prodotti in {product.category.name}</h2>
          <ProductGrid products={others} />
        </section>
      )}
    </div>
  );
}

function Availability({ inventory }: { inventory: number }) {
  if (inventory === 0) return <Badge variant="destructive">Esaurito</Badge>;
  if (inventory <= LOW_STOCK) {
    return (
      <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
        Solo {inventory} {inventory === 1 ? "rimasto" : "rimasti"}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-emerald-500 text-emerald-700 dark:text-emerald-400">
      Disponibile
    </Badge>
  );
}
