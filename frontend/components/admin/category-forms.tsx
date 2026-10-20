"use client";

import { useActionState, useState } from "react";
import { Check, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { createCategory, deleteCategory, renameCategory } from "@/app/actions/admin";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { FormMessage } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/lib/api/types";
import type { CategoryState } from "@/lib/admin-schema";

export function CreateCategoryForm() {
  const [state, action, pending] = useActionState<CategoryState, FormData>(createCategory, {});
  const error = state.fieldErrors?.name?.[0];

  return (
    <form action={action} className="flex flex-col gap-2" noValidate>
      <div className="flex gap-2">
        <Input
          name="name"
          placeholder="Nuova categoria"
          aria-label="Nome della nuova categoria"
          defaultValue={state.values?.name}
          aria-invalid={error ? true : undefined}
          maxLength={255}
          className="max-w-xs"
        />
        <Button type="submit" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" /> : <Plus />}
          Aggiungi
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <FormMessage message={state.message} />
    </form>
  );
}

export function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      {editing ? (
        <RenameForm category={category} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex items-center gap-2">
          <span className="flex-1 font-medium">{category.name}</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)} aria-label={`Rinomina ${category.name}`}>
            <Pencil />
          </Button>
          <ConfirmButton
            title={`Eliminare la categoria "${category.name}"?`}
            description="Si può eliminare solo una categoria senza prodotti."
            confirmLabel="Elimina"
            action={() => deleteCategory(category.id)}
          >
            <Button variant="ghost" size="icon-sm" aria-label={`Elimina ${category.name}`}>
              <Trash2 />
            </Button>
          </ConfirmButton>
        </div>
      )}
    </li>
  );
}

function RenameForm({ category, onDone }: { category: Category; onDone: () => void }) {
  const [state, action, pending] = useActionState<CategoryState, FormData>(
    async (prev: CategoryState, formData: FormData) => {
      const next = await renameCategory(category.id, prev, formData);
      if (next.saved) onDone();
      return next;
    },
    { values: { name: category.name } },
  );
  const error = state.fieldErrors?.name?.[0];

  return (
    <form action={action} className="flex flex-col gap-2" noValidate>
      <div className="flex items-center gap-2">
        <Input
          name="name"
          defaultValue={state.values?.name}
          aria-label="Nuovo nome della categoria"
          aria-invalid={error ? true : undefined}
          maxLength={255}
          autoFocus
          className="flex-1"
        />
        <Button type="submit" size="icon-sm" disabled={pending} aria-label="Salva">
          {pending ? <LoaderCircle className="animate-spin" /> : <Check />}
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onDone} disabled={pending} aria-label="Annulla">
          <X />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <FormMessage message={state.message} />
    </form>
  );
}
