import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategories } from "@/lib/api/catalog";

export const metadata: Metadata = {
  title: "Nuovo prodotto",
};

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-4">
      <BackToProducts />
      <Card>
        <CardHeader>
          <CardTitle>Nuovo prodotto</CardTitle>
          <CardDescription>Dopo averlo creato potrai aggiungere le immagini.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-80 w-full" />}>
            <NewProductForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function NewProductForm() {
  return <ProductForm categories={await getCategories()} />;
}

function BackToProducts() {
  return (
    <Link
      href="/admin/products"
      className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Tutti i prodotti
    </Link>
  );
}
