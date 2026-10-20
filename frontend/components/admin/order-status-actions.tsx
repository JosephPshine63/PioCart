"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, PackageCheck, Truck, XCircle } from "lucide-react";
import { updateOrderStatus } from "@/app/actions/admin";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { FormMessage } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import type { Order } from "@/lib/api/types";
import { NEXT_STATUSES } from "@/lib/admin-schema";
import { formatPrice } from "@/lib/format";

export function OrderStatusActions({ order }: { order: Order }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const next = NEXT_STATUSES[order.status];

  if (next.length === 0) {
    return <p className="text-sm text-muted-foreground">Nessun cambio di stato possibile.</p>;
  }

  function move(status: "SHIPPED" | "DELIVERED") {
    setError(undefined);
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, status);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <FormMessage message={error} />
      <div className="flex flex-wrap gap-2">
        {next.includes("SHIPPED") && (
          <Button onClick={() => move("SHIPPED")} disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" /> : <Truck />}
            Segna come spedito
          </Button>
        )}
        {next.includes("DELIVERED") && (
          <Button onClick={() => move("DELIVERED")} disabled={pending}>
            {pending ? <LoaderCircle className="animate-spin" /> : <PackageCheck />}
            Segna come consegnato
          </Button>
        )}
        {next.includes("CANCELLED") && (
          <ConfirmButton
            title={`Annullare l'ordine n. ${order.id}?`}
            description={`Il cliente riceverà il rimborso di ${formatPrice(order.totalAmount)} su Stripe e gli articoli torneranno disponibili in magazzino. L'operazione non si può annullare.`}
            confirmLabel="Annulla e rimborsa"
            action={() => updateOrderStatus(order.id, "CANCELLED")}
          >
            <Button variant="outline" disabled={pending}>
              <XCircle />
              Annulla ordine
            </Button>
          </ConfirmButton>
        )}
      </div>
    </div>
  );
}
