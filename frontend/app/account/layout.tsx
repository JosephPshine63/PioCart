import { Suspense } from "react";
import type { Metadata } from "next";
import { AccountNav, AccountNavLinks } from "@/components/account/account-nav";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Il mio account</h1>
      <div className="grid items-start gap-8 md:grid-cols-[12rem_1fr]">
        <Suspense fallback={<AccountNavLinks pathname={null} />}>
          <AccountNav />
        </Suspense>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
