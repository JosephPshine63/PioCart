"use client";

import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/actions/admin";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Button } from "@/components/ui/button";

type DeleteProductButtonProps = {
  productId: number;
  productName: string;
  /** Go back to the product list once deleted (used on the product's own page). */
  backToList?: boolean;
  compact?: boolean;
};

export function DeleteProductButton({ productId, productName, backToList, compact }: DeleteProductButtonProps) {
  return (
    <ConfirmButton
      title={`Eliminare "${productName}"?`}
      description="Il prodotto e le sue immagini vengono eliminati e tolti dai carrelli. Un prodotto già ordinato non si può eliminare: in quel caso imposta la giacenza a 0."
      confirmLabel="Elimina"
      action={() => deleteProduct(productId, backToList)}
    >
      {compact ? (
        <Button variant="ghost" size="icon-sm" aria-label={`Elimina ${productName}`}>
          <Trash2 />
        </Button>
      ) : (
        <Button variant="outline">
          <Trash2 />
          Elimina prodotto
        </Button>
      )}
    </ConfirmButton>
  );
}
