import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { Pagination } from "@/components/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminOrders } from "@/lib/admin";
import { adminHref, ORDER_FILTERS, pageParam, statusParam } from "@/lib/admin-params";
import { formatDate, formatPrice } from "@/lib/format";
import { orderItemCount } from "@/lib/orders";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ordini",
};

export default function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Ordini</h2>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
        <OrderTable searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function OrderTable({ searchParams }: Pick<PageProps<"/admin/orders">, "searchParams">) {
  const params = await searchParams;
  const status = statusParam(params);
  const page = pageParam(params);
  const orders = await getAdminOrders(status, page);

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Filtra per stato" className="flex flex-wrap gap-1">
        {ORDER_FILTERS.map((filter) => {
          const active = filter.status === status;
          return (
            <Link
              key={filter.label}
              href={adminHref("/admin/orders", { status: filter.status })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                active ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {orders.content.length === 0 ? (
        <p className="rounded-lg border px-4 py-10 text-center text-sm text-muted-foreground">Nessun ordine.</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordine</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden sm:table-cell">Data</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Articoli</TableHead>
                <TableHead className="text-right">Totale</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.content.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">
                      n. {order.id}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-56">
                    <span className="block truncate">{order.customerName}</span>
                    <span className="block truncate text-xs text-muted-foreground">{order.customerEmail}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{formatDate(order.orderDate)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-right tabular-nums">{orderItemCount(order)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPrice(order.totalAmount)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={orders.totalPages}
        href={(p) => adminHref("/admin/orders", { status, page: p })}
      />
    </div>
  );
}
