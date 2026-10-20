import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatPrice } from "@/lib/format";
import { getMyOrders, orderItemCount } from "@/lib/orders";

export const metadata: Metadata = {
  title: "I miei ordini",
};

export default function OrdersPage() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Ordini</h2>
      <Suspense fallback={<OrdersSkeleton />}>
        <OrderList />
      </Suspense>
    </section>
  );
}

async function OrderList() {
  const orders = await getMyOrders();

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border px-4 py-12 text-center">
        <Package className="size-10 text-muted-foreground" />
        <p className="font-medium">Non hai ancora effettuato ordini</p>
        <p className="text-sm text-muted-foreground">Quando completi un acquisto lo trovi qui.</p>
        <Button asChild className="mt-2">
          <Link href="/products">Vai al catalogo</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {orders.map((order) => {
        const count = orderItemCount(order);
        return (
          <li key={order.id}>
            <Link
              href={`/account/orders/${order.id}`}
              className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">Ordine n. {order.id}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDate(order.orderDate)} · {count} {count === 1 ? "articolo" : "articoli"}
                </span>
              </div>
              <span className="font-semibold tabular-nums">{formatPrice(order.totalAmount)}</span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function OrdersSkeleton() {
  return (
    <div className="flex flex-col divide-y rounded-lg border" aria-hidden>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
