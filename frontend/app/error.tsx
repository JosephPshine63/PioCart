"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Qualcosa è andato storto</h1>
      <p className="text-muted-foreground">Il negozio non risponde in questo momento. Riprova tra qualche istante.</p>
      <Button onClick={reset}>Riprova</Button>
    </div>
  );
}
