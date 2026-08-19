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
  date: string | null
  status: "OPEN" | "CLOSED"
  matches: FixtureMatch[]
  restingTeams: Array<{
    id: string
    name: string
  }>
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
  const [fechas, teams] = await Promise.all([
    prisma.fecha.findMany({
      where: { tournamentId },
      orderBy: { number: "asc" },
      select: {
        id: true,
        number: true,
        date: true,
        status: true,
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
    }),
    prisma.team.findMany({
      where: { tournamentId },
      select: { id: true, name: true },
    }),
  ])

  return fechas.map((fecha) => ({
    id: fecha.id,
    number: fecha.number,
    date: fecha.date ? fecha.date.toISOString().slice(0, 10) : null,
    status: fecha.status,
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
    restingTeams: teams.filter(
      (team) => !fecha.matches.some(
        (match) => match.teamOne.id === team.id || match.teamTwo.id === team.id
      )
    ),
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
        date: new Date(),
        generationMethod: "RANDOM",
      },
      select: {
        id: true,
        number: true,
        date: true,
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

    const restingTeams = shuffledTeams.length % 2 === 0 ? [] : [shuffledTeams[shuffledTeams.length - 1]]

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
          teamOneScore: 0,
          teamTwoScore: 0,
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
      date: fecha.date ? fecha.date.toISOString().slice(0, 10) : null,
      status: "OPEN" as const,
      matches: createdMatches,
      restingTeams,
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

  const currentMatch = await prisma.match.findUnique({
    where: { id: matchId },
    select: { fecha: { select: { status: true } } },
  })

  if (!currentMatch) {
    return { error: "El partido no existe." }
  }

  if (currentMatch.fecha.status === "CLOSED") {
    return { error: "La fecha está cerrada y sus resultados son de solo lectura." }
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
      fechaId: true,
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

export async function updateFechaDate(fechaId: string, date: string) {
  if (!fechaId) {
    return { error: "La fecha es inválida." }
  }

  if (!date) {
    return { error: "Ingresá una fecha válida." }
  }

  const currentFecha = await prisma.fecha.findUnique({
    where: { id: fechaId },
    select: { status: true },
  })

  if (!currentFecha) {
    return { error: "La fecha no existe." }
  }

  if (currentFecha.status === "CLOSED") {
    return { error: "La fecha está cerrada y es de solo lectura." }
  }

  const parsedDate = new Date(`${date}T12:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return { error: "La fecha ingresada no es válida." }
  }

  const fecha = await prisma.fecha.update({
    where: { id: fechaId },
    data: { date: parsedDate },
    select: {
      id: true,
      number: true,
      date: true,
    },
  })

  revalidatePath(`/campeonato`)
  return {
    success: true,
    fecha: {
      id: fecha.id,
      number: fecha.number,
      date: fecha.date ? fecha.date.toISOString().slice(0, 10) : null,
    },
  }
}

export async function closeFecha(fechaId: string) {
  if (!fechaId) {
    return { error: "La fecha es inválida." }
  }

  const fecha = await prisma.fecha.update({
    where: { id: fechaId },
    data: { status: "CLOSED" },
    select: {
      id: true,
      status: true,
    },
  })

  revalidatePath(`/campeonato`)
  return { success: true, fecha }
}

export async function deleteFecha(fechaId: string) {
  if (!fechaId) {
    return { error: "La fecha es inválida." }
  }

  const fecha = await prisma.fecha.findUnique({
    where: { id: fechaId },
    select: { status: true },
  })

  if (!fecha) {
    return { error: "La fecha no existe." }
  }

  if (fecha.status === "CLOSED") {
    return { error: "La fecha está cerrada y no se puede eliminar." }
  }

  await prisma.fecha.delete({
    where: { id: fechaId },
  })

  revalidatePath(`/campeonato`)
  return { success: true }
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

