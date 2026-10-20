import type { ComponentProps, ReactNode } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FieldProps = ComponentProps<"input"> & {
  label: string;
  name: string;
  description?: string;
  errors?: string[];
};

export function Field({ label, name, description, errors, ...props }: FieldProps) {
  return (
    <FieldShell label={label} name={name} description={description} errors={errors}>
      {(control) => <Input name={name} {...control} {...props} />}
    </FieldShell>
  );
}

type TextareaFieldProps = ComponentProps<"textarea"> & Omit<FieldProps, keyof ComponentProps<"input">> & { name: string };

export function TextareaField({ label, name, description, errors, ...props }: TextareaFieldProps) {
  return (
    <FieldShell label={label} name={name} description={description} errors={errors}>
      {(control) => <Textarea name={name} {...control} {...props} />}
    </FieldShell>
  );
}

type ControlProps = { id: string; "aria-invalid"?: true; "aria-describedby"?: string };

function FieldShell({
  label,
  name,
  description,
  errors,
  children,
}: Pick<FieldProps, "label" | "name" | "description" | "errors"> & { children: (control: ControlProps) => ReactNode }) {
  const id = `field-${name}`;
  const error = errors?.[0];
  const describedBy = [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(" ");

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy || undefined })}
      {description && !error && (
        <p id={`${id}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      {message}
    </div>
  );
}

export function SubmitButton({ pending, children, className }: { pending: boolean; children: ReactNode; className?: string }) {
  return (
    <Button type="submit" size="lg" disabled={pending} className={cn("w-full", className)}>
      {pending && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}
