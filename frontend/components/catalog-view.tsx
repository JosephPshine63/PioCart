import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { Pagination } from "@/components/pagination";
import { ProductGrid } from "@/components/product-grid";
import { Badge } from "@/components/ui/badge";
import { getBrands, getCategories, getProducts } from "@/lib/api/catalog";
import { backendSort, catalogHref, PAGE_SIZE, SORT_OPTIONS, type CatalogParams } from "@/lib/catalog-params";
import { cn } from "@/lib/utils";

interface CatalogViewProps {
  /** Path the filter links point to, e.g. /products or /categories/Books. */
  pathname: string;
  params: CatalogParams;
  /** Set on category pages: the category filter is fixed by the URL. */
  fixedCategory?: string;
}

export async function CatalogView({ pathname, params, fixedCategory }: CatalogViewProps) {
  const category = fixedCategory ?? params.category;
  const [result, categories, brands] = await Promise.all([
    getProducts({
      category,
      brand: params.brand,
      q: params.q,
      page: params.page - 1,
      size: PAGE_SIZE,
      sort: backendSort(params.sort),
    }),
    getCategories(),
    getBrands(),
  ]);
  const href = (changes: Partial<CatalogParams>) => catalogHref(pathname, params, changes);

  const filters = (
    <div className="flex flex-col gap-6 text-sm">
      {!fixedCategory && (
        <FilterGroup title="Categoria">
          <FilterLink href={href({ category: undefined })} active={!params.category}>
            Tutte
          </FilterLink>
          {categories.map((c) => (
            <FilterLink key={c.id} href={href({ category: c.name })} active={params.category === c.name}>
              {c.name}
            </FilterLink>
          ))}
        </FilterGroup>
      )}
      <FilterGroup title="Marca">
        <FilterLink href={href({ brand: undefined })} active={!params.brand}>
          Tutte
        </FilterLink>
        {brands.map((brand) => (
          <FilterLink key={brand} href={href({ brand })} active={params.brand === brand}>
            {brand}
          </FilterLink>
        ))}
      </FilterGroup>
    </div>
  );

  const activeFilters = [
    !fixedCategory && params.category && { label: params.category, href: href({ category: undefined }) },
    params.brand && { label: params.brand, href: href({ brand: undefined }) },
    params.q && { label: `“${params.q}”`, href: href({ q: undefined }) },
  ].filter((filter): filter is { label: string; href: string } => Boolean(filter));

  return (
    <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
      <aside className="hidden lg:block">{filters}</aside>

      <div className="flex min-w-0 flex-col gap-6">
        <details className="rounded-lg border px-4 py-3 lg:hidden">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <SlidersHorizontal className="size-4" aria-hidden />
            Filtri
          </summary>
          <div className="pt-4">{filters}</div>
        </details>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              {result.totalElements} {result.totalElements === 1 ? "prodotto" : "prodotti"}
            </span>
            {activeFilters.map((filter) => (
              <Badge key={filter.label} variant="secondary" asChild>
                <Link href={filter.href} aria-label={`Rimuovi filtro ${filter.label}`}>
                  {filter.label}
                  <X aria-hidden />
                </Link>
              </Badge>
            ))}
          </div>
          <nav aria-label="Ordina per" className="flex flex-wrap gap-1 text-sm">
            {SORT_OPTIONS.map((option) => (
              <Link
                key={option.value}
                href={href({ sort: option.value })}
                aria-current={params.sort === option.value ? "true" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1 text-muted-foreground hover:text-foreground",
                  params.sort === option.value && "bg-muted font-medium text-foreground",
                )}
              >
                {option.label}
              </Link>
            ))}
          </nav>
        </div>

        {result.content.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
            <p className="font-medium">Nessun prodotto trovato</p>
            <p className="text-sm text-muted-foreground">Prova a cambiare o rimuovere i filtri.</p>
          </div>
        ) : (
          <ProductGrid products={result.content} />
        )}

        <Pagination
          page={params.page}
          totalPages={result.totalPages}
          href={(page) => href({ page })}
        />
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-medium">{title}</h2>
      <ul className="flex flex-col gap-1.5">{children}</ul>
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "true" : undefined}
        className={cn("text-muted-foreground hover:text-foreground", active && "font-medium text-foreground")}
      >
        {children}
      </Link>
    </li>
  );
}
