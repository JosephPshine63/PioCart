import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard, AuthFormSkeleton } from "../auth-card";
import { RegisterForm } from "@/components/auth-forms";
import { safeReturnTo } from "@/lib/auth-schema";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Crea un account",
  robots: { index: false },
};

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return (
    <AuthCard title="Crea il tuo account" description="Bastano pochi dati per iniziare a fare acquisti.">
      <Suspense fallback={<AuthFormSkeleton fields={5} />}>
        <RegisterFormLoader searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function RegisterFormLoader({ searchParams }: Pick<PageProps<"/register">, "searchParams">) {
  const returnTo = safeReturnTo((await searchParams).returnTo);
  if (await getCurrentUser()) redirect(returnTo);
  return <RegisterForm returnTo={returnTo} />;
}
