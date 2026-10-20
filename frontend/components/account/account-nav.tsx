"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Profilo", icon: UserRound },
  { href: "/account/orders", label: "Ordini", icon: Package },
];

export function AccountNav() {
  return <AccountNavLinks pathname={usePathname()} />;
}

/** The links alone; with no pathname none is highlighted (used as the Suspense fallback). */
export function AccountNavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Area account" className="flex gap-1 md:flex-col">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/account" ? pathname === href : !!pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
