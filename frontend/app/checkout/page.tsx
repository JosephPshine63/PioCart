import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CircleAlert, ImageOff } from "lucide-react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { TestCardHint } from "@/components/checkout/test-card-hint";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Cart } from "@/lib/api/types";
import { itemCount } from "@/lib/cart";
import { checkoutNotice } from "@/lib/checkout";
import { formatPrice, imageSrc } from "@/lib/format";
import { getCart } from "@/lib/session";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-2">
        <Link
          href="/cart"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Torna al carrello
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
      </div>
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CheckoutLoader({ searchParams }: Pick<PageProps<"/checkout">, "searchParams">) {
  const [cart, { status }] = await Promise.all([getCart(), searchParams]);
  // The proxy only checks that the cookie exists; an expired token ends up here.
  if (!cart) redirect("/login?returnTo=%2Fcheckout");
  if (cart.items.length === 0) redirect("/cart");

  const notice = checkoutNotice(status);
  const testMode = process.env.STRIPE_TEST_MODE === "true";

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-4">
        {notice && (
          <div role="status" className="flex items-start gap-2 rounded-md border bg-muted/50 p-3 text-sm">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            {notice}
          </div>
        )}
        <section aria-labelledby="checkout-items" className="rounded-lg border">
          <h2 id="checkout-items" className="border-b px-4 py-3 font-semibold">
            Il tuo ordine
          </h2>
          <CheckoutItems cart={cart} />
        </section>
        {testMode && <TestCardHint />}
      </div>

      <Card className="lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle>Riepilogo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Articoli ({itemCount(cart)})</span>
            <span className="tabular-nums">{formatPrice(cart.totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Spedizione</span>
            <span>Gratuita</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>Totale</span>
            <span className="tabular-nums">{formatPrice(cart.totalAmount)}</span>
          </div>
        </CardContent>
        <CardFooter>
          <CheckoutForm />
        </CardFooter>
      </Card>
    </div>
  );
}

function CheckoutItems({ cart }: { cart: Cart }) {
  return (
    <ul className="divide-y">
      {cart.items.map(({ product, quantity, totalPrice }) => {
        const cover = product.images[0];
        return (
          <li key={product.id} className="flex items-center gap-4 px-4 py-3">
            <span className="relative size-14 shrink-0 overflow-hidden rounded-md border bg-muted">
              {cover ? (
                <Image src={imageSrc(cover.id)} alt="" fill sizes="56px" className="object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-muted-foreground">
                  <ImageOff className="size-4" />
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">Quantità: {quantity}</p>
            </div>
            <span className="font-medium tabular-nums">{formatPrice(totalPrice)}</span>
          </li>
        );
      })}
    </ul>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}
