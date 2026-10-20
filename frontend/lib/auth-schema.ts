import { z } from "zod";

// Mirrors the backend LoginRequest / CreateUserRequest constraints, with Italian messages.
export const loginSchema = z.object({
  email: z.string().trim().min(1, "Inserisci l'email").pipe(z.email("Email non valida")),
  password: z.string().min(1, "Inserisci la password"),
});

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "Inserisci il nome").max(100, "Massimo 100 caratteri"),
    lastName: z.string().trim().min(1, "Inserisci il cognome").max(100, "Massimo 100 caratteri"),
    email: z.string().trim().min(1, "Inserisci l'email").pipe(z.email("Email non valida")),
    password: z.string().min(8, "Almeno 8 caratteri").max(72, "Massimo 72 caratteri"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Le password non coincidono",
    path: ["confirmPassword"],
  });

export type FormState<Field extends string> = {
  /** Error not tied to a single field, e.g. wrong credentials. */
  message?: string;
  fieldErrors?: Partial<Record<Field, string[]>>;
  /** Submitted values (never the password) so the form keeps them after an error. */
  values?: Partial<Record<Field, string>>;
};

export type LoginState = FormState<keyof z.infer<typeof loginSchema>>;
export type RegisterState = FormState<keyof z.infer<typeof registerSchema>>;

/** Only same-origin relative paths are allowed as post-login destinations (no open redirects). */
export function safeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }
  return value;
}
