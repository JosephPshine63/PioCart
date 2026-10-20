import { Suspense } from "react";
import type { Metadata } from "next";
import { Package, UserRound } from "lucide-react";
import { SectionNav, SectionNavLinks, type SectionLink } from "@/components/section-nav";

export const metadata: Metadata = {
  robots: { index: false },
};

const LINKS: SectionLink[] = [
  { href: "/account", label: "Profilo", icon: <UserRound />, exact: true },
  { href: "/account/orders", label: "Ordini", icon: <Package /> },
];

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Il mio account</h1>
      <div className="grid items-start gap-8 md:grid-cols-[12rem_1fr]">
        <Suspense fallback={<SectionNavLinks label="Area account" links={LINKS} pathname={null} />}>
          <SectionNav label="Area account" links={LINKS} />
        </Suspense>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
