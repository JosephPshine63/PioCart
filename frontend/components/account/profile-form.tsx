"use client";

import { useActionState } from "react";
import { CircleCheck } from "lucide-react";
import { updateProfile } from "@/app/actions/account";
import { Field, FormMessage, SubmitButton } from "@/components/form-fields";
import type { User } from "@/lib/api/types";
import type { ProfileState } from "@/lib/account-schema";

export function ProfileForm({ user }: { user: User }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {
    values: { firstName: user.firstName, lastName: user.lastName },
  });

  return (
    // React resets the form after the action, so the inputs show the saved values from the state
    <form action={action} className="grid gap-4" noValidate>
      <FormMessage message={state.message} />
      {state.saved && !pending && (
        <p role="status" className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm">
          <CircleCheck className="size-4 shrink-0 text-primary" />
          Modifiche salvate.
        </p>
      )}
      <div className="grid items-start gap-4 sm:grid-cols-2">
        <Field
          label="Nome"
          name="firstName"
          autoComplete="given-name"
          defaultValue={state.values?.firstName}
          errors={state.fieldErrors?.firstName}
          required
          maxLength={100}
        />
        <Field
          label="Cognome"
          name="lastName"
          autoComplete="family-name"
          defaultValue={state.values?.lastName}
          errors={state.fieldErrors?.lastName}
          required
          maxLength={100}
        />
      </div>
      <Field label="Email" name="email" type="email" value={user.email} readOnly disabled description="L'email non può essere modificata." />
      <SubmitButton pending={pending} className="sm:w-fit">
        Salva modifiche
      </SubmitButton>
    </form>
  );
}
