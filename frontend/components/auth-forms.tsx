"use client";

import { useActionState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { login, register } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <div className="grid gap-4 sm:grid-cols-2">
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

type FieldProps = ComponentProps<"input"> & {
  label: string;
  name: string;
  description?: string;
  errors?: string[];
};

function Field({ label, name, description, errors, ...props }: FieldProps) {
  const id = `field-${name}`;
  const error = errors?.[0];
  const describedBy = [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(" ");

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...props}
      />
      {description && !error && (
        <p id={`${id}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function FormMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      {message}
    </div>
  );
}

function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}
