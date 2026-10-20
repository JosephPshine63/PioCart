import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CartView } from "@/components/cart/cart-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getCart } from "@/lib/session";

export const metadata: Metadata = {
  title: "Carrello",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Carrello</h1>
      <Suspense fallback={<CartSkeleton />}>
        <CartLoader />
      </Suspense>
    </div>
  );
}

async function CartLoader() {
  const cart = await getCart();
  // The proxy only checks that the cookie exists; an expired token ends up here.
  if (!cart) redirect("/login?returnTo=%2Fcart");
  return <CartView cart={cart} />;
}

function CartSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="size-20 rounded-md" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-auto h-8 w-28" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}
