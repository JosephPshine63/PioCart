import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  /** 1-based current page. */
  page: number;
  totalPages: number;
  href: (page: number) => string;
}

/** Page numbers to show: always the first and last, plus a window around the current one. */
function visiblePages(page: number, totalPages: number): (number | "gap")[] {
  const pages: (number | "gap")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      pages.push(p);
    } else if (pages.at(-1) !== "gap") {
      pages.push("gap");
    }
  }
  return pages;
}

export function Pagination({ page, totalPages, href }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginazione" className="flex items-center justify-center gap-1">
      <PageArrow page={page - 1} totalPages={totalPages} href={href} label="Pagina precedente">
        <ChevronLeft />
      </PageArrow>
      {visiblePages(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <Button key={p} variant={p === page ? "outline" : "ghost"} size="icon" asChild>
            <Link href={href(p)} aria-current={p === page ? "page" : undefined}>
              {p}
            </Link>
          </Button>
        ),
      )}
      <PageArrow page={page + 1} totalPages={totalPages} href={href} label="Pagina successiva">
        <ChevronRight />
      </PageArrow>
    </nav>
  );
}

function PageArrow({
  page,
  totalPages,
  href,
  label,
  children,
}: Omit<PaginationProps, "page"> & { page: number; label: string; children: React.ReactNode }) {
  if (page < 1 || page > totalPages) {
    return (
      <Button variant="ghost" size="icon" disabled aria-label={label}>
        {children}
      </Button>
    );
  }
  return (
    <Button variant="ghost" size="icon" asChild>
      <Link href={href(page)} aria-label={label}>
        {children}
      </Link>
    </Button>
  );
}
