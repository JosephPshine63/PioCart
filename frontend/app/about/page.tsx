import type { Metadata } from "next";
import Link from "next/link";
import { GitHubIcon } from "@/components/brand-icons";
import { DeveloperLinks } from "@/components/developer-links";
import { JsonLd } from "@/components/json-ld";
import { DEVELOPER } from "@/lib/contacts";
import { absoluteUrl, breadcrumbJsonLd, openGraph, personJsonLd } from "@/lib/seo";
import { REPO_URL } from "@/lib/site";

const DESCRIPTION =
  "PioCart è un e-commerce dimostrativo creato da Giuseppe Pio Ruocco per il portfolio: Spring Boot, Next.js, Stripe in modalità test e CI/CD.";

export const metadata: Metadata = {
  title: "Il progetto",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: openGraph({ title: "Il progetto", description: DESCRIPTION, url: "/about" }),
};

const STACK = [
  {
    title: "Backend",
    text: "Spring Boot 3 e Java 17, PostgreSQL con Spring Data JPA, autenticazione JWT stateless e test di integrazione con Testcontainers.",
  },
  {
    title: "Frontend",
    text: "Next.js 16 con App Router e Cache Components, React 19, Tailwind CSS 4 e shadcn/ui. Fa da BFF: il browser non chiama mai il backend.",
  },
  {
    title: "Pagamenti",
    text: "Stripe Checkout in modalità test: l'ordine viene confermato solo dopo aver verificato il pagamento, con rimborso automatico se manca la merce.",
  },
  {
    title: "Infrastruttura",
    text: "Backend in Docker su un server Ubuntu esposto con Tailscale Funnel, storefront su Vercel e pipeline CI/CD con GitHub Actions.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "Il progetto",
          url: absoluteUrl("/about"),
          description: DESCRIPTION,
          about: { "@type": "SoftwareSourceCode", name: "PioCart", codeRepository: REPO_URL },
          author: personJsonLd(),
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Il progetto", path: "/about" },
        ])}
      />

      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Il progetto</h1>
        <p className="text-lg text-muted-foreground">
          PioCart è un negozio online dimostrativo che ho sviluppato per il mio portfolio. Mostra un e-commerce completo,
          dal catalogo al pagamento, fino alla gestione degli ordini da parte dell&apos;amministratore.
        </p>
        <p className="rounded-lg border border-brand/30 bg-brand/5 px-4 py-3 text-sm">
          I pagamenti usano Stripe in modalità test: nessun addebito è reale e nessun ordine viene spedito. Per provare
          il checkout usa la carta <span className="font-mono">4242 4242 4242 4242</span>.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Cosa c&apos;è dentro</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          {STACK.map((item) => (
            <div key={item.title} className="rounded-lg border p-4">
              <dt className="font-medium">{item.title}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{item.text}</dd>
            </div>
          ))}
        </dl>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener"
          className="inline-flex h-10 w-fit items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <GitHubIcon className="size-4" />
          Codice sorgente su GitHub
        </a>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Contatti</h2>
        <p className="text-muted-foreground">
          Sono {DEVELOPER.name}. Se il progetto ti interessa o vuoi parlarne, scrivimi o trovami su questi canali.
        </p>
        <DeveloperLinks showLabels />
      </section>

      <p className="text-sm text-muted-foreground">
        <Link href="/products" className="underline-offset-4 hover:text-foreground hover:underline">
          Torna al catalogo
        </Link>
      </p>
    </div>
  );
}
