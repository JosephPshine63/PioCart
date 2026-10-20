"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type QuantityStepperProps = {
  value: number;
  max: number;
  onChange: (value: number) => void;
  /** Accessible name of what is being counted, e.g. the product name. */
  label: string;
  min?: number;
  disabled?: boolean;
};

export function QuantityStepper({ value, max, onChange, label, min = 1, disabled }: QuantityStepperProps) {
  return (
    <div role="group" aria-label={`Quantità di ${label}`} className="inline-flex items-center rounded-md border">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Diminuisci quantità"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Minus />
      </Button>
      <span aria-live="polite" className="min-w-8 text-center text-sm tabular-nums">
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Aumenta quantità"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus />
      </Button>
    </div>
  );
}
