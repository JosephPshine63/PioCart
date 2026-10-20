"use client";

import { useState } from "react";
import { Check, Copy, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TEST_CARD } from "@/lib/checkout";

/** Shown while Stripe runs in test mode: no real card is charged. */
export function TestCardHint() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(TEST_CARD.replaceAll(" ", ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available (e.g. insecure context): the number is still on screen.
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 text-sm">
      <p className="flex items-center gap-2 font-medium">
        <FlaskConical className="size-4 text-primary" />
        Modalità di prova: nessun addebito reale
      </p>
      <p className="text-muted-foreground">
        Usa la carta di test qui sotto, una data di scadenza futura qualsiasi e un CVC qualsiasi.
      </p>
      <div className="flex items-center gap-2">
        <code className="rounded bg-background px-2 py-1 font-mono tabular-nums">{TEST_CARD}</code>
        <Button type="button" variant="ghost" size="icon-sm" onClick={copy} aria-label="Copia il numero della carta di test">
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
    </div>
  );
}
