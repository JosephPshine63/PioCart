"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, register } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/form-fields";
import type { LoginState, RegisterState } from "@/lib/auth-schema";

export function LoginForm({ returnTo }: { returnTo: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="returnTo" value={returnTo} />
      <FormMessage message={state.message} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
        required
        autoFocus
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        errors={state.fieldErrors?.password}
        required
      />
      <SubmitButton pending={pending}>Accedi</SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        Non hai un account?{" "}
        <Link href={withReturnTo("/register", returnTo)} className="font-medium text-foreground underline-offset-4 hover:underline">
          Registrati
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ returnTo }: { returnTo: string }) {
  const [state, action, pending] = useActionState<RegisterState, FormData>(register, {});

  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="returnTo" value={returnTo} />
      <FormMessage message={state.message} />
      <div className="grid items-start gap-4 sm:grid-cols-2">
        <Field
          label="Nome"
          name="firstName"
          autoComplete="given-name"
          defaultValue={state.values?.firstName}
          errors={state.fieldErrors?.firstName}
          required
          autoFocus
        />
        <Field
          label="Cognome"
          name="lastName"
          autoComplete="family-name"
          defaultValue={state.values?.lastName}
          errors={state.fieldErrors?.lastName}
          required
        />
      </div>
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
        required
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        description="Almeno 8 caratteri."
        errors={state.fieldErrors?.password}
        required
        minLength={8}
        maxLength={72}
      />
      <Field
        label="Conferma password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        errors={state.fieldErrors?.confirmPassword}
        required
      />
      <SubmitButton pending={pending}>Crea account</SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        Hai già un account?{" "}
        <Link href={withReturnTo("/login", returnTo)} className="font-medium text-foreground underline-offset-4 hover:underline">
          Accedi
        </Link>
      </p>
    </form>
  );
}

function withReturnTo(path: string, returnTo: string) {
  return returnTo === "/" ? path : `${path}?returnTo=${encodeURIComponent(returnTo)}`;
}
