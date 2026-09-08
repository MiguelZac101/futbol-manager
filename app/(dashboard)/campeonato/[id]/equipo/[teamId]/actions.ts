"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authorizeTournamentMutation, syncDemoImageAsset } from "@/lib/demo-workspace"

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

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { tournamentId: true },
  })

  if (!team) {
    return { error: "El equipo no existe." }
  }

  await authorizeTournamentMutation(team.tournamentId)
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

  await syncDemoImageAsset(team.tournamentId, null, player.photoUrl)

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

  const playerToUpdate = await prisma.player.findUnique({
    where: { id: playerId },
    select: { photoUrl: true, team: { select: { tournamentId: true } } },
  })

  if (!playerToUpdate) {
    return { error: "El jugador no existe." }
  }

  await authorizeTournamentMutation(playerToUpdate.team.tournamentId)
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

  await syncDemoImageAsset(playerToUpdate.team.tournamentId, playerToUpdate.photoUrl, player.photoUrl)

  return { success: true, player }
}

export async function deletePlayer(playerId: string) {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { team: { select: { tournamentId: true } } },
  })

  if (!player) {
    return { error: "El jugador no existe." }
  }

  await authorizeTournamentMutation(player.team.tournamentId)
  await prisma.player.delete({
    where: { id: playerId },
  })

  return { success: true }
}
