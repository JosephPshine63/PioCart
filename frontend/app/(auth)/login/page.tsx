import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard, AuthFormSkeleton } from "../auth-card";
import { LoginForm } from "@/components/auth-forms";
import { safeReturnTo } from "@/lib/auth-schema";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Accedi",
  robots: { index: false },
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthCard title="Accedi a PioCart" description="Inserisci email e password per continuare.">
      <Suspense fallback={<AuthFormSkeleton fields={2} />}>
        <LoginFormLoader searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function LoginFormLoader({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const returnTo = safeReturnTo((await searchParams).returnTo);
  if (await getCurrentUser()) redirect(returnTo);
  return <LoginForm returnTo={returnTo} />;
}
