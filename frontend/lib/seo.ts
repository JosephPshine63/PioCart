import type { Metadata } from "next";
import { DEVELOPER, PORTFOLIO_URL, PROFILE_LINKS } from "@/lib/contacts";
import { SITE_NAME, SITE_URL } from "@/lib/site";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/** The site's card from app/opengraph-image.tsx; segments with their own image file override it. */
const DEFAULT_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME };

/** A page's openGraph replaces the layout's one entirely, so every page starts from these defaults. */
export function openGraph(overrides: OpenGraph = {}): OpenGraph {
  return { siteName: SITE_NAME, locale: "it_IT", type: "website", images: [DEFAULT_IMAGE], ...overrides } as OpenGraph;
}

/** Shortens a description to fit search snippets, cutting at a word boundary. */
export function truncate(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${space > 0 ? cut.slice(0, space) : cut}…`;
}

export const absoluteUrl = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`;

export function personJsonLd() {
  return {
    "@type": "Person",
    name: DEVELOPER.name,
    url: PORTFOLIO_URL,
    sameAs: PROFILE_LINKS.map((link) => link.url),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
