"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"

const playerSchema = z.object({
  name: z.string().trim().min(2, "El nombre del jugador debe tener al menos 2 caracteres"),
  dni: z.string().trim().min(2, "El DNI es obligatorio"),
  photoUrl: z.string().url("La imagen debe ser una URL válida").nullable().optional(),
})

export async function createPlayer(teamId: string, formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    dni: formData.get("dni"),
    photoUrl: formData.get("photoUrl"),
  }

  const parsed = playerSchema.safeParse(rawData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const player = await prisma.player.create({
    data: {
      name: parsed.data.name,
      dni: parsed.data.dni,
      photoUrl: parsed.data.photoUrl ?? null,
      teamId,
    },
    select: {
      id: true,
      name: true,
      dni: true,
      photoUrl: true,
    },
  })

  return { success: true, player }
}

export async function updatePlayer(playerId: string, formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    dni: formData.get("dni"),
    photoUrl: formData.get("photoUrl"),
  }

  const parsed = playerSchema.safeParse(rawData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const player = await prisma.player.update({
    where: { id: playerId },
    data: {
      name: parsed.data.name,
      dni: parsed.data.dni,
      photoUrl: parsed.data.photoUrl ?? null,
    },
    select: {
      id: true,
      name: true,
      dni: true,
      photoUrl: true,
    },
  })

  return { success: true, player }
}

export async function deletePlayer(playerId: string) {
  await prisma.player.delete({
    where: { id: playerId },
  })

  return { success: true }
}
