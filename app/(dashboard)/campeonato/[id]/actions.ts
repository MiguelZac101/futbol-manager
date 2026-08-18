"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const teamSchema = z.object({
  name: z.string().trim().min(2, "El nombre del equipo debe tener al menos 2 caracteres"),
  imageUrl: z.string().url("La imagen debe ser una URL válida").nullable().optional(),
})

export type FixtureMatch = {
  id: string
  slot: number
  status: "SCHEDULED" | "COMPLETED"
  teamOneScore: number | null
  teamTwoScore: number | null
  teamOne: {
    id: string
    name: string
  }
  teamTwo: {
    id: string
    name: string
  }
}

export type FixtureDate = {
  id: string
  number: number
  matches: FixtureMatch[]
}

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

export async function getTournamentFechas(tournamentId: string): Promise<FixtureDate[]> {
  const fechas = await prisma.fecha.findMany({
    where: { tournamentId },
    orderBy: { number: "asc" },
    select: {
      id: true,
      number: true,
      matches: {
        orderBy: { slot: "asc" },
        select: {
          id: true,
          slot: true,
          status: true,
          teamOneScore: true,
          teamTwoScore: true,
          teamOne: {
            select: {
              id: true,
              name: true,
            },
          },
          teamTwo: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  return fechas.map((fecha) => ({
    id: fecha.id,
    number: fecha.number,
    matches: fecha.matches.map((match) => ({
      id: match.id,
      slot: match.slot,
      status: match.status,
      teamOneScore: match.teamOneScore,
      teamTwoScore: match.teamTwoScore,
      teamOne: {
        id: match.teamOne.id,
        name: match.teamOne.name,
      },
      teamTwo: {
        id: match.teamTwo.id,
        name: match.teamTwo.name,
      },
    })),
  }))
}

export async function generateFecha(tournamentId: string) {
  const teams = await prisma.team.findMany({
    where: { tournamentId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  if (teams.length < 2) {
    return { error: "Necesitás al menos 2 equipos para generar una fecha." }
  }

  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5)

  const lastFecha = await prisma.fecha.findFirst({
    where: { tournamentId },
    orderBy: { number: "desc" },
    select: { number: true },
  })

  const nextNumber = (lastFecha?.number ?? 0) + 1

  const createdFecha = await prisma.$transaction(async (tx) => {
    const fecha = await tx.fecha.create({
      data: {
        tournamentId,
        number: nextNumber,
        generationMethod: "RANDOM",
      },
      select: {
        id: true,
        number: true,
      },
    })

    const createdMatches = [] as Array<{
      id: string
      slot: number
      status: "SCHEDULED" | "COMPLETED"
      teamOneScore: number | null
      teamTwoScore: number | null
      teamOne: { id: string; name: string }
      teamTwo: { id: string; name: string }
    }>

    for (let index = 0; index < shuffledTeams.length - 1; index += 2) {
      const teamOne = shuffledTeams[index]
      const teamTwo = shuffledTeams[index + 1]

      const match = await tx.match.create({
        data: {
          fechaId: fecha.id,
          slot: index / 2 + 1,
          teamOneId: teamOne.id,
          teamTwoId: teamTwo.id,
          status: "SCHEDULED",
        },
        select: {
          id: true,
          slot: true,
          status: true,
          teamOneScore: true,
          teamTwoScore: true,
          teamOne: {
            select: {
              id: true,
              name: true,
            },
          },
          teamTwo: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      createdMatches.push({
        id: match.id,
        slot: match.slot,
        status: match.status,
        teamOneScore: match.teamOneScore,
        teamTwoScore: match.teamTwoScore,
        teamOne: match.teamOne,
        teamTwo: match.teamTwo,
      })
    }

    return {
      id: fecha.id,
      number: fecha.number,
      matches: createdMatches,
    }
  })

  revalidatePath(`/campeonato/${tournamentId}`)
  return { success: true, fecha: createdFecha }
}

export async function updateMatchResult(
  matchId: string,
  result: { teamOneScore: number; teamTwoScore: number }
) {
  const teamOneScore = Number(result.teamOneScore)
  const teamTwoScore = Number(result.teamTwoScore)

  if (Number.isNaN(teamOneScore) || Number.isNaN(teamTwoScore)) {
    return { error: "Ingresá los dos resultados antes de guardar." }
  }

  const match = await prisma.match.update({
    where: { id: matchId },
    data: {
      teamOneScore,
      teamTwoScore,
      status: "COMPLETED",
    },
    select: {
      id: true,
      slot: true,
      status: true,
      teamOneScore: true,
      teamTwoScore: true,
      teamOne: {
        select: {
          id: true,
          name: true,
        },
      },
      teamTwo: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  revalidatePath(`/campeonato`)
  return {
    success: true,
    match: {
      id: match.id,
      slot: match.slot,
      status: match.status,
      teamOneScore: match.teamOneScore,
      teamTwoScore: match.teamTwoScore,
      teamOne: match.teamOne,
      teamTwo: match.teamTwo,
    },
  }
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

export async function updateTeam(teamId: string, formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    imageUrl: formData.get("imageUrl"),
  }

  const parsed = teamSchema.safeParse(rawData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const team = await prisma.team.update({
    where: { id: teamId },
    data: {
      name: parsed.data.name,
      imageUrl: parsed.data.imageUrl ?? null,
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  })

  revalidatePath("/campeonato")
  return { success: true, team }
}

export async function deleteTeam(teamId: string) {
  if (!teamId) {
    return { error: "ID del equipo inválido" }
  }

  await prisma.team.delete({
    where: { id: teamId },
  })

  revalidatePath("/campeonato")
  return { success: true }
}

