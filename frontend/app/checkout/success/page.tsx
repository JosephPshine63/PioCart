import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api/client";
import type { Order } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Ordine confermato",
  robots: { index: false },
};

export default function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 py-10">
      <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
        <OrderLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function OrderLoader({ searchParams }: Pick<PageProps<"/checkout/success">, "searchParams">) {
  const { order: orderParam } = await searchParams;
  const orderId = Number(orderParam);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) notFound();

  let order: Order;
  try {
    order = await api<Order>(`/orders/${orderId}/order`, { auth: true, cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) redirect(`/login?returnTo=${encodeURIComponent(`/checkout/success?order=${orderId}`)}`);
      if (error.status === 404) notFound();
    }
    throw error;
  }

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
          <CircleCheck className="size-7 text-primary" />
        </span>
        <CardTitle className="text-2xl">Grazie per il tuo ordine!</CardTitle>
        <CardDescription>
          Il pagamento è andato a buon fine. Ordine n. {order.id} del{" "}
          {new Date(`${order.orderDate}T00:00:00`).toLocaleDateString("it-IT", { dateStyle: "long" })}.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <ul className="flex flex-col gap-2">
          {order.items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-4">
              <span className="min-w-0">
                <Link href={`/products/${item.productId}`} className="font-medium hover:underline">
                  {item.productName}
                </Link>
                <span className="text-muted-foreground"> × {item.quantity}</span>
              </span>
              <span className="shrink-0 tabular-nums">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <Separator />
        <div className="flex justify-between text-base font-semibold">
          <span>Totale pagato</span>
          <span className="tabular-nums">{formatPrice(order.totalAmount)}</span>
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <Button asChild size="lg">
          <Link href="/products">Continua lo shopping</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
