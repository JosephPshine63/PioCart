import { z } from "zod";
import type { FormState } from "@/lib/auth-schema";

// Mirrors the backend UserUpdateRequest constraints.
export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Inserisci il nome").max(100, "Massimo 100 caratteri"),
  lastName: z.string().trim().min(1, "Inserisci il cognome").max(100, "Massimo 100 caratteri"),
});

export type ProfileState = FormState<keyof z.infer<typeof profileSchema>> & {
  /** Set after a successful save. */
  saved?: boolean;
};
