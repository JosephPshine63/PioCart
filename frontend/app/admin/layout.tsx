import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import { Package, ShoppingBag, Tags } from "lucide-react";
import { SectionNav, SectionNavLinks, type SectionLink } from "@/components/section-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: { template: "%s · Admin | PioCart", default: "Amministrazione" },
  robots: { index: false },
};

const LINKS: SectionLink[] = [
  { href: "/admin/orders", label: "Ordini", icon: <ShoppingBag /> },
  { href: "/admin/products", label: "Prodotti", icon: <Package /> },
  { href: "/admin/categories", label: "Categorie", icon: <Tags /> },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Amministrazione</h1>
      <div className="grid items-start gap-8 md:grid-cols-[12rem_1fr]">
        <Suspense fallback={<SectionNavLinks label="Area amministrazione" links={LINKS} pathname={null} />}>
          <SectionNav label="Area amministrazione" links={LINKS} />
        </Suspense>
        <div className="min-w-0">
          <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
            <AdminGate>{children}</AdminGate>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// Signed-in non-admins get a 404; the backend enforces the role on every call regardless.
async function AdminGate({ children }: { children: ReactNode }) {
  await requireAdmin();
  return children;
}
