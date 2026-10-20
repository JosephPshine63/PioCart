import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>PioCart, negozio dimostrativo. I pagamenti sono in modalità test.</p>
        <nav className="flex gap-4">
          <Link href="/products" className="hover:text-foreground">
            Catalogo
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
