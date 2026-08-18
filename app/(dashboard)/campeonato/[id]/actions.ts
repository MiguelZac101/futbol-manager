"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"

const teamSchema = z.object({
  name: z.string().trim().min(2, "El nombre del equipo debe tener al menos 2 caracteres"),
  imageUrl: z.string().url("La imagen debe ser una URL válida").nullable().optional(),
})

export async function getTournamentTeams(tournamentId: string) {
  return prisma.team.findMany({
    where: { tournamentId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  })
}

export async function createTeam(tournamentId: string, formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    imageUrl: formData.get("imageUrl"),
  }

  const parsed = teamSchema.safeParse(rawData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const team = await prisma.team.create({
    data: {
      name: parsed.data.name,
      imageUrl: parsed.data.imageUrl ?? null,
      tournamentId,
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  })

  return { success: true, team }
}
