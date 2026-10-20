import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-bold tracking-tight">Pagina non trovata</h1>
      <p className="text-muted-foreground">Il prodotto o la pagina che cerchi non esiste o non è più disponibile.</p>
      <Button asChild>
        <Link href="/products">Torna al catalogo</Link>
      </Button>
    </div>
  );
}
