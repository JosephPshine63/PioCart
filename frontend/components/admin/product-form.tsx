"use client";

import { useActionState } from "react";
import { CircleCheck } from "lucide-react";
import { saveProduct } from "@/app/actions/admin";
import { Field, FormMessage, SubmitButton, TextareaField } from "@/components/form-fields";
import type { Category, Product } from "@/lib/api/types";
import type { ProductState } from "@/lib/admin-schema";

type ProductFormProps = { product?: Product; categories: Category[] };

export function ProductForm({ product, categories }: ProductFormProps) {
  const [state, action, pending] = useActionState<ProductState, FormData>(
    saveProduct.bind(null, product?.id ?? null),
    {
      values: product && {
        name: product.name,
        brand: product.brand,
        category: product.category.name,
        price: product.price.toFixed(2).replace(".", ","),
        inventory: String(product.inventory),
        description: product.description ?? "",
      },
    },
  );

  return (
    <form action={action} className="grid gap-4" noValidate>
      <FormMessage message={state.message} />
      {state.saved && !pending && (
        <p role="status" className="flex items-center gap-2 rounded-md border bg-muted p-3 text-sm">
          <CircleCheck className="size-4 shrink-0 text-primary" />
          Prodotto salvato.
        </p>
      )}
      <div className="grid items-start gap-4 sm:grid-cols-2">
        <Field label="Nome" name="name" defaultValue={state.values?.name} errors={state.fieldErrors?.name} required maxLength={255} />
        <Field label="Marca" name="brand" defaultValue={state.values?.brand} errors={state.fieldErrors?.brand} required maxLength={255} />
        <Field
          label="Categoria"
          name="category"
          list="category-options"
          autoComplete="off"
          description="Scegline una o scrivi un nome nuovo per crearla."
          defaultValue={state.values?.category}
          errors={state.fieldErrors?.category}
          required
          maxLength={255}
        />
        <datalist id="category-options">
          {categories.map((category) => (
            <option key={category.id} value={category.name} />
          ))}
        </datalist>
        <div className="grid items-start gap-4 grid-cols-2">
          <Field
            label="Prezzo (€)"
            name="price"
            inputMode="decimal"
            placeholder="19,90"
            defaultValue={state.values?.price}
            errors={state.fieldErrors?.price}
            required
          />
          <Field
            label="Giacenza"
            name="inventory"
            type="number"
            min={0}
            step={1}
            defaultValue={state.values?.inventory ?? "0"}
            errors={state.fieldErrors?.inventory}
            required
          />
        </div>
      </div>
      <TextareaField
        label="Descrizione"
        name="description"
        rows={3}
        maxLength={255}
        description="Massimo 255 caratteri."
        defaultValue={state.values?.description}
        errors={state.fieldErrors?.description}
      />
      <SubmitButton pending={pending} className="sm:w-fit">
        {product ? "Salva modifiche" : "Crea prodotto"}
      </SubmitButton>
    </form>
  );
}
