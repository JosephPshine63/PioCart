export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const SITE_NAME = "PioCart";

export const SITE_DESCRIPTION =
  "Negozio online dimostrativo di elettronica, libri e articoli per la casa: catalogo, carrello e pagamento con Stripe in modalità test.";

export const REPO_URL = "https://github.com/JosephPshine63/PioCart";

/** Vercel preview deployments must stay out of search engines. */
export const isIndexable = process.env.VERCEL_ENV !== "preview";

/** Logo teal (#009FAA) and the dark theme background. */
export const THEME_COLORS = { light: "#009faa", dark: "#0a1113" } as const;
