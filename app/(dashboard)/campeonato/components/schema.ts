// app/(dashboard)/campeonato/components/schema.ts
import { z } from "zod"

export const tournamentSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .min(3, "El nombre debe tener al menos 3 caracteres"),
})

export type TournamentFormValues = z.infer<typeof tournamentSchema>