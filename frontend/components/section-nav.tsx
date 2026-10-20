"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type SectionLink = {
  href: string;
  label: string;
  icon: ReactNode;
  /** Only active on this exact path, not on its sub-pages. */
  exact?: boolean;
};

type SectionNavProps = { label: string; links: SectionLink[] };

/** Side navigation of an area (account, admin); render it inside Suspense with `SectionNavLinks` as fallback. */
export function SectionNav(props: SectionNavProps) {
  return <SectionNavLinks {...props} pathname={usePathname()} />;
}

/** The links alone; with no pathname none is highlighted (used as the Suspense fallback). */
export function SectionNavLinks({ label, links, pathname }: SectionNavProps & { pathname: string | null }) {
  return (
    <nav aria-label={label} className="flex gap-1 overflow-x-auto md:flex-col">
      {links.map(({ href, label, icon, exact }) => {
        const active = !!pathname && (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors [&_svg]:size-4",
              active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {icon}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
