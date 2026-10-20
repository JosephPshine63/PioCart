import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/account/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Il mio account",
};

export default function AccountPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profilo</CardTitle>
        <CardDescription>I dati con cui ti riconosciamo nei tuoi ordini.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileLoader />
        </Suspense>
      </CardContent>
    </Card>
  );
}

async function ProfileLoader() {
  const user = await getCurrentUser();
  // The proxy only checks that the cookie exists; an expired token ends up here.
  if (!user) redirect("/login?returnTo=%2Faccount");
  return <ProfileForm user={user} />;
}

function ProfileSkeleton() {
  return (
    <div className="grid gap-4" aria-hidden>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-15 w-full" />
        <Skeleton className="h-15 w-full" />
      </div>
      <Skeleton className="h-15 w-full" />
      <Skeleton className="h-10 w-36" />
    </div>
  );
}
