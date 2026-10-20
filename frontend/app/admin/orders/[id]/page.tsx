import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OrderLines } from "@/components/account/order-lines";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { OrderStatusActions } from "@/components/admin/order-status-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import { getOrder } from "@/lib/orders";

export async function generateMetadata({ params }: PageProps<"/admin/orders/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Ordine n. ${id}` };
}

export default function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/admin/orders"
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

async function OrderDetail({ params }: Pick<PageProps<"/admin/orders/[id]">, "params">) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) notFound();
  const order = await getOrder(orderId, `/admin/orders/${orderId}`);
  if (!order) notFound();

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl">Ordine n. {order.id}</CardTitle>
            <OrderStatusBadge status={order.status} />
          </div>
          <CardDescription>
            {order.paidAt ? `Pagato il ${formatDateTime(order.paidAt)}` : `Creato il ${formatDate(order.orderDate)}, non pagato`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <OrderLines items={order.items} />
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>Totale</span>
            <span className="tabular-nums">{formatPrice(order.totalAmount)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{order.customerName}</span>
            <a href={`mailto:${order.customerEmail}`} className="break-all text-muted-foreground hover:underline">
              {order.customerEmail}
            </a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Stato</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderStatusActions order={order} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
