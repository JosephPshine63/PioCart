import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OrderLines } from "@/components/account/order-lines";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrderStatus } from "@/lib/api/types";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { getOrder, orderItemCount } from "@/lib/orders";

export async function generateMetadata({ params }: PageProps<"/account/orders/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Ordine n. ${id}` };
}

const STATUS_NOTES: Partial<Record<OrderStatus, string>> = {
  PROCESSING: "Abbiamo ricevuto il pagamento e stiamo preparando il tuo ordine.",
  SHIPPED: "Il tuo ordine è in viaggio.",
  DELIVERED: "Il tuo ordine è stato consegnato.",
  CANCELLED: "Questo ordine è stato annullato. Se lo avevi già pagato, l'importo ti viene rimborsato.",
};

export default function OrderPage({ params }: PageProps<"/account/orders/[id]">) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/account/orders"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Tutti gli ordini
      </Link>
      <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
        <OrderDetail params={params} />
      </Suspense>
    </div>
  );
}

async function OrderDetail({ params }: Pick<PageProps<"/account/orders/[id]">, "params">) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) notFound();

  const order = await getOrder(orderId, `/account/orders/${orderId}`);
  if (!order) notFound();
  const count = orderItemCount(order);
  const note = STATUS_NOTES[order.status];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-xl">Ordine n. {order.id}</CardTitle>
          <OrderStatusBadge status={order.status} />
        </div>
        <CardDescription>
          {order.paidAt ? `Pagato il ${formatDateTime(order.paidAt)}` : `Creato il ${formatDate(order.orderDate)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        {note && <p className="rounded-md bg-muted p-3 text-muted-foreground">{note}</p>}
        <OrderLines items={order.items} />
        <Separator />
        <dl className="flex flex-col gap-2">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              Articoli ({count})
            </dt>
            <dd className="tabular-nums">{formatPrice(order.totalAmount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Spedizione</dt>
            <dd>Gratuita</dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>Totale</dt>
            <dd className="tabular-nums">{formatPrice(order.totalAmount)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
