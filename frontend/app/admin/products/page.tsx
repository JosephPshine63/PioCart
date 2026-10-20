import { Suspense } from "react";
import type { Metadata } from "next";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, Pencil, Plus, Search } from "lucide-react";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { Pagination } from "@/components/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ADMIN_PAGE_SIZE } from "@/lib/admin";
import { adminHref, pageParam, textParam } from "@/lib/admin-params";
import { getProducts } from "@/lib/api/catalog";
import { formatPrice, imageSrc } from "@/lib/format";

export const metadata: Metadata = {
  title: "Prodotti",
};

export default function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Prodotti</h2>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus />
            Nuovo prodotto
          </Link>
        </Button>
      </div>
      <Suspense fallback={<TableSkeleton />}>
        <ProductTable searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function ProductTable({ searchParams }: Pick<PageProps<"/admin/products">, "searchParams">) {
  const params = await searchParams;
  const q = textParam(params, "q");
  const page = pageParam(params);
  const products = await getProducts({ q: q || undefined, page: page - 1, size: ADMIN_PAGE_SIZE, sort: "id,desc" });

  return (
    <div className="flex flex-col gap-4">
      <Form action="/admin/products" className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" type="search" defaultValue={q} placeholder="Cerca per nome, marca…" aria-label="Cerca prodotti" className="pl-8" />
      </Form>

      {products.content.length === 0 ? (
        <p className="rounded-lg border px-4 py-10 text-center text-sm text-muted-foreground">
          {q ? `Nessun prodotto trovato per “${q}”.` : "Non ci sono ancora prodotti."}
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16" />
                <TableHead>Prodotto</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead className="text-right">Prezzo</TableHead>
                <TableHead className="text-right">Giacenza</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.content.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="relative size-10 overflow-hidden rounded border bg-muted">
                      {product.images[0] ? (
                        <Image src={imageSrc(product.images[0].id)} alt="" fill sizes="40px" className="object-cover" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-muted-foreground">
                          <ImageOff className="size-4" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-64">
                    <Link href={`/admin/products/${product.id}`} className="block truncate font-medium hover:underline">
                      {product.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">{product.brand}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{product.category.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPrice(product.price)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {product.inventory > 0 ? product.inventory : <Badge variant="destructive">Esaurito</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link href={`/admin/products/${product.id}`} aria-label={`Modifica ${product.name}`}>
                          <Pencil />
                        </Link>
                      </Button>
                      <DeleteProductButton productId={product.id} productName={product.name} compact />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={products.totalPages}
        href={(p) => adminHref("/admin/products", { q, page: p })}
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      <Skeleton className="h-9 w-full max-w-sm" />
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
