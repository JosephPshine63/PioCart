"use client";

import { useActionState } from "react";
import { LoaderCircle, Lock } from "lucide-react";
import { startCheckout, type CheckoutState } from "@/app/actions/checkout";
import { CartError } from "@/components/cart/cart-lines";
import { Button } from "@/components/ui/button";

export function CheckoutForm() {
  const [state, action, pending] = useActionState<CheckoutState>(startCheckout, {});

  return (
    <form action={action} className="flex w-full flex-col gap-3">
      <CartError message={state.error ?? null} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? <LoaderCircle className="animate-spin" /> : <Lock />}
        Paga con Stripe
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Verrai reindirizzato alla pagina di pagamento sicura di Stripe.
      </p>
    </form>
  );
}
