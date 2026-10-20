import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImages } from "@/components/admin/product-images";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategories, getProduct } from "@/lib/api/catalog";

export const metadata: Metadata = {
  title: "Modifica prodotto",
};

export default function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/admin/products"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Tutti i prodotti
      </Link>
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-xl" />}>
        <ProductEditor params={params} />
      </Suspense>
    </div>
  );
}

async function ProductEditor({ params }: Pick<PageProps<"/admin/products/[id]">, "params">) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isSafeInteger(productId) || productId <= 0) notFound();
  const [product, categories] = await Promise.all([getProduct(productId), getCategories()]);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            <CardTitle>{product.name}</CardTitle>
            <CardDescription>Prodotto n. {product.id}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/products/${product.id}`} target="_blank">
              <ExternalLink />
              Vedi nel negozio
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ProductForm product={product} categories={categories} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Immagini</CardTitle>
          <CardDescription>Le immagini compaiono nel catalogo nell&apos;ordine in cui sono state caricate.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductImages productId={product.id} images={product.images} />
        </CardContent>
      </Card>

      <div>
        <DeleteProductButton productId={product.id} productName={product.name} backToList />
      </div>
    </div>
  );
}
