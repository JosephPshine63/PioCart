// Parses and builds the catalog URL state shared by /products and /categories/[name].

export const SORT_OPTIONS = [
  { value: "newest", label: "Novità", backend: "id,desc" },
  { value: "price-asc", label: "Prezzo crescente", backend: "price,asc" },
  { value: "price-desc", label: "Prezzo decrescente", backend: "price,desc" },
  { value: "name", label: "Nome A-Z", backend: "name,asc" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const PAGE_SIZE = 12;

type SearchParams = Record<string, string | string[] | undefined>;

export interface CatalogParams {
  category?: string;
  brand?: string;
  q?: string;
  sort: SortValue;
  /** 1-based, as shown in the URL. */
  page: number;
}

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export function parseCatalogParams(searchParams: SearchParams): CatalogParams {
  const sort = first(searchParams.sort);
  const page = Number(first(searchParams.page));
  return {
    category: first(searchParams.category),
    brand: first(searchParams.brand),
    q: first(searchParams.q),
    sort: SORT_OPTIONS.some((option) => option.value === sort) ? (sort as SortValue) : "newest",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function backendSort(sort: SortValue): string {
  return SORT_OPTIONS.find((option) => option.value === sort)!.backend;
}

/** Builds a catalog URL from the current params; changing a filter goes back to page 1. */
export function catalogHref(pathname: string, params: CatalogParams, changes: Partial<CatalogParams>): string {
  const next = { ...params, ...changes };
  if (!("page" in changes)) next.page = 1;

  const search = new URLSearchParams();
  if (next.category) search.set("category", next.category);
  if (next.brand) search.set("brand", next.brand);
  if (next.q) search.set("q", next.q);
  if (next.sort !== "newest") search.set("sort", next.sort);
  if (next.page > 1) search.set("page", String(next.page));

  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}
