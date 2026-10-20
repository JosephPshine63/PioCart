import type { OrderStatus } from "@/lib/api/types";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** 1-based page from the query string, defaulting to 1. */
export function pageParam(searchParams: SearchParams): number {
  const page = Number(first(searchParams.page));
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function textParam(searchParams: SearchParams, key: string): string {
  return first(searchParams[key])?.trim().slice(0, 100) ?? "";
}

export const ORDER_FILTERS: { status?: OrderStatus; label: string }[] = [
  { label: "Tutti" },
  { status: "PROCESSING", label: "Da spedire" },
  { status: "SHIPPED", label: "Spediti" },
  { status: "DELIVERED", label: "Consegnati" },
  { status: "CANCELLED", label: "Annullati" },
];

export function statusParam(searchParams: SearchParams): OrderStatus | undefined {
  const status = first(searchParams.status);
  return ORDER_FILTERS.find((filter) => filter.status && filter.status === status)?.status;
}

/** Builds an admin list URL, dropping empty values and page 1. */
export function adminHref(pathname: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || (key === "page" && value === 1)) continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}
