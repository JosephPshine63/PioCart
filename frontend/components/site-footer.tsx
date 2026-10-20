import Link from "next/link";
import { DeveloperLinks } from "@/components/developer-links";
import { DEVELOPER } from "@/lib/contacts";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-xl flex-col gap-3">
          <p>
            PioCart è un progetto dimostrativo sviluppato da{" "}
            <span className="font-medium text-foreground">{DEVELOPER.name}</span> per il mio portfolio. I pagamenti
            sono in modalità test.
          </p>
          <DeveloperLinks className="-ml-2" />
        </div>
        <nav aria-label="Link del sito" className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/products" className="hover:text-foreground">
            Catalogo
          </Link>
          <Link href="/about" className="hover:text-foreground">
            Il progetto
          </Link>
          <Link href="/cart" className="hover:text-foreground">
            Carrello
          </Link>
          <Link href="/account" className="hover:text-foreground">
            Account
          </Link>
        </nav>
      </div>
    </footer>
  );
}
