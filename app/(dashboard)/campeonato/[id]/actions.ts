"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

function getLocalDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function buildLocalDateTime(date: string, time: string) {
  const dateParts = date.split("-").map(Number)
  const timeParts = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time)

  if (dateParts.length !== 3 || dateParts.some((part) => Number.isNaN(part)) || !timeParts) {
    return null
  }

  const [year, month, day] = dateParts
  const hours = Number(timeParts[1])
  const minutes = Number(timeParts[2])

  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

const teamSchema = z.object({
  name: z.string().trim().min(2, "El nombre del equipo debe tener al menos 2 caracteres"),
  imageUrl: z.string().url("La imagen debe ser una URL válida").nullable().optional(),
})

const matchDetailsSchema = z.object({
  scheduledAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ingresá una hora válida."),
  teamOneScore: z.coerce.number().int().min(0, "Ingresá un resultado válido."),
  teamTwoScore: z.coerce.number().int().min(0, "Ingresá un resultado válido."),
})

export type FixtureMatch = {
  id: string
  slot: number
  scheduledAt: string | null
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED"
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

type FixtureTeam = {
  id: string
  name: string
}

type FixturePair = [FixtureTeam, FixtureTeam | null]

function getPairKey(firstTeamId: string, secondTeamId: string) {
  return [firstTeamId, secondTeamId].sort().join(":")
}

function findUniquePairings(teams: FixtureTeam[], playedPairs: Set<string>): FixturePair[] | null {
  const availableTeams: Array<FixtureTeam | null> = [
    ...teams,
    ...(teams.length % 2 === 1 ? [null] : []),
  ].sort(() => Math.random() - 0.5)

  function findPairings(remainingTeams: Array<FixtureTeam | null>): FixturePair[] | null {
    if (remainingTeams.length === 0) {
      return []
    }

    const firstTeam = remainingTeams[0]
    const candidates = remainingTeams.slice(1).sort(() => Math.random() - 0.5)

    for (const secondTeam of candidates) {
      if (!firstTeam && !secondTeam) {
        continue
      }

      const hasPlayed = firstTeam && secondTeam
        ? playedPairs.has(getPairKey(firstTeam.id, secondTeam.id))
        : false

      if (hasPlayed) {
        continue
      }

      const nextRemainingTeams = remainingTeams.filter(
        (team) => team !== firstTeam && team !== secondTeam
      )
      const restOfPairings = findPairings(nextRemainingTeams)

      if (restOfPairings) {
        return [
          [firstTeam ?? secondTeam!, firstTeam ? secondTeam : null],
          ...restOfPairings,
        ]
      }
    }

    return null
  }

  return findPairings(availableTeams)
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

export type StandingsRow = {
  teamId: string
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export async function getTournamentStandings(tournamentId: string): Promise<StandingsRow[]> {
  const [teams, matches] = await Promise.all([
    prisma.team.findMany({
      where: { tournamentId },
      select: { id: true, name: true },
    }),
    prisma.match.findMany({
      where: {
        status: { in: ["IN_PROGRESS", "COMPLETED"] },
        fecha: { tournamentId },
      },
      select: {
        teamOneId: true,
        teamTwoId: true,
        teamOneScore: true,
        teamTwoScore: true,
      },
    }),
  ])

  const standings = new Map<string, StandingsRow>(
    teams.map((team) => [team.id, {
      teamId: team.id,
      teamName: team.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    }])
  )

  for (const match of matches) {
    const teamOne = standings.get(match.teamOneId)
    const teamTwo = standings.get(match.teamTwoId)

    if (!teamOne || !teamTwo) {
      continue
    }

    const teamOneScore = match.teamOneScore ?? 0
    const teamTwoScore = match.teamTwoScore ?? 0

    teamOne.played += 1
    teamTwo.played += 1
    teamOne.goalsFor += teamOneScore
    teamOne.goalsAgainst += teamTwoScore
    teamTwo.goalsFor += teamTwoScore
    teamTwo.goalsAgainst += teamOneScore

    if (teamOneScore > teamTwoScore) {
      teamOne.won += 1
      teamOne.points += 3
      teamTwo.lost += 1
    } else if (teamOneScore < teamTwoScore) {
      teamTwo.won += 1
      teamTwo.points += 3
      teamOne.lost += 1
    } else {
      teamOne.drawn += 1
      teamTwo.drawn += 1
      teamOne.points += 1
      teamTwo.points += 1
    }
  }

  const rows = Array.from(standings.values()).map((row) => ({
    ...row,
    goalDifference: row.goalsFor - row.goalsAgainst,
  }))

  return rows.sort((firstRow, secondRow) => {
    if (firstRow.points !== secondRow.points) {
      return secondRow.points - firstRow.points
    }

    if (firstRow.goalsFor !== secondRow.goalsFor) {
      return secondRow.goalsFor - firstRow.goalsFor
    }

    if (firstRow.goalDifference !== secondRow.goalDifference) {
      return secondRow.goalDifference - firstRow.goalDifference
    }

    return firstRow.teamName.localeCompare(secondRow.teamName, "es")
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
            scheduledAt: true,
            status: true,
            teamOneScore: true,
            teamTwoScore: true,
            teamOneId: true,
            teamTwoId: true,
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
      scheduledAt: match.scheduledAt?.toISOString() ?? null,
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
  const [teams, tournament] = await Promise.all([
    prisma.team.findMany({
    where: { tournamentId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    }),
    prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { fixtureStartTime: true, matchIntervalMinutes: true },
    }),
  ])

  if (!tournament) {
    return { error: "El campeonato no existe." }
  }

  if (teams.length < 2) {
    return { error: "Necesitás al menos 2 equipos para generar una fecha." }
  }

  const openFecha = await prisma.fecha.findFirst({
    where: {
      tournamentId,
      status: "OPEN",
    },
    orderBy: { number: "asc" },
    select: { number: true },
  })

  if (openFecha) {
    return {
      error: `No se puede generar la fecha siguiente hasta cerrar la fecha ${openFecha.number}.`,
      requiresClose: true,
    }
  }

  const previousMatches = await prisma.match.findMany({
    where: {
      fecha: { tournamentId },
    },
    select: {
      teamOneId: true,
      teamTwoId: true,
    },
  })

  const playedPairs = new Set(
    previousMatches.map((match) => getPairKey(match.teamOneId, match.teamTwoId))
  )
  const pairings = findUniquePairings(teams, playedPairs)

  if (!pairings) {
    return {
      error: "No quedan cruces disponibles sin repetir para generar otra fecha.",
    }
  }

  const lastFecha = await prisma.fecha.findFirst({
    where: { tournamentId },
    orderBy: { number: "desc" },
    select: { number: true },
  })

  const nextNumber = (lastFecha?.number ?? 0) + 1
  const fixtureStartTime = tournament.fixtureStartTime
  const fixtureDate = getLocalDateString(new Date())
  const firstMatchTime = buildLocalDateTime(fixtureDate, fixtureStartTime)

  if (!firstMatchTime) {
    return { error: "La hora de inicio del fixture no es válida." }
  }

  const createdFecha = await prisma.$transaction(async (tx) => {
    const fecha = await tx.fecha.create({
      data: {
        tournamentId,
        number: nextNumber,
        date: buildLocalDateTime(getLocalDateString(new Date()), "12:00")!,
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
      scheduledAt: string | null
      status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED"
      teamOneScore: number | null
      teamTwoScore: number | null
      teamOne: { id: string; name: string }
      teamTwo: { id: string; name: string }
    }>

    const restingTeams = pairings
      .filter(([, secondTeam]) => secondTeam === null)
      .map(([firstTeam]) => firstTeam)

    let matchNumber = 0

    for (const [teamOne, teamTwo] of pairings) {
      if (!teamTwo) {
        continue
      }

      const slot = matchNumber + 1

      const match = await tx.match.create({
        data: {
          fechaId: fecha.id,
          slot,
          scheduledAt: new Date(
            firstMatchTime.getTime() + matchNumber * tournament.matchIntervalMinutes * 60_000
          ),
          teamOneId: teamOne.id,
          teamTwoId: teamTwo.id,
          status: "SCHEDULED",
          teamOneScore: 0,
          teamTwoScore: 0,
        },
        select: {
          id: true,
          slot: true,
          scheduledAt: true,
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
        scheduledAt: match.scheduledAt?.toISOString() ?? null,
        status: match.status,
        teamOneScore: match.teamOneScore,
        teamTwoScore: match.teamTwoScore,
        teamOne: match.teamOne,
        teamTwo: match.teamTwo,
      })

      matchNumber += 1
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

export async function updateFixtureSettings(
  tournamentId: string,
  settings: { fixtureStartTime: string; matchIntervalMinutes: number }
) {
  if (!tournamentId) {
    return { error: "El campeonato es inválido." }
  }

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.fixtureStartTime)) {
    return { error: "Ingresá una hora de inicio válida." }
  }

  const interval = Number(settings.matchIntervalMinutes)
  if (!Number.isInteger(interval) || interval < 1) {
    return { error: "El intervalo debe ser un número entero mayor a cero." }
  }

  const tournament = await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      fixtureStartTime: settings.fixtureStartTime,
      matchIntervalMinutes: interval,
    },
    select: {
      fixtureStartTime: true,
      matchIntervalMinutes: true,
    },
  })

  revalidatePath(`/campeonato/${tournamentId}`)
  return { success: true, tournament }
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
    select: { status: true, fecha: { select: { status: true } } },
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
      status: currentMatch.status,
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

export async function updateMatchDetails(
  matchId: string,
  details: {
    scheduledAt: string
    teamOneScore: string | number
    teamTwoScore: string | number
  }
) {
  if (!matchId) {
    return { error: "El partido es inválido." }
  }

  const parsed = matchDetailsSchema.safeParse(details)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const currentMatch = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      fechaId: true,
      fecha: {
        select: {
          date: true,
          status: true,
          tournamentId: true,
        },
      },
    },
  })

  if (!currentMatch) {
    return { error: "El partido no existe." }
  }

  if (currentMatch.fecha.status === "CLOSED") {
    return { error: "La fecha está cerrada y sus partidos son de solo lectura." }
  }

  const date = currentMatch.fecha.date?.toISOString().slice(0, 10)
  if (!date) {
    return { error: "Seleccioná un día para la fecha antes de asignar horarios." }
  }

  const scheduledAt = buildLocalDateTime(date, parsed.data.scheduledAt)
  if (!scheduledAt) {
    return { error: "La hora ingresada no es válida." }
  }

  const fecha = await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: {
        scheduledAt,
        teamOneScore: parsed.data.teamOneScore,
        teamTwoScore: parsed.data.teamTwoScore,
      },
      select: { id: true },
    })

    const matches = await tx.match.findMany({
      where: { fechaId: currentMatch.fechaId },
      select: {
        id: true,
        slot: true,
        scheduledAt: true,
        status: true,
        teamOneScore: true,
        teamTwoScore: true,
        teamOne: {
          select: { id: true, name: true },
        },
        teamTwo: {
          select: { id: true, name: true },
        },
      },
    })

    const orderedMatches = matches
      .slice()
      .sort((a, b) => {
        const firstTime = a.scheduledAt ? a.scheduledAt.getTime() : Number.POSITIVE_INFINITY
        const secondTime = b.scheduledAt ? b.scheduledAt.getTime() : Number.POSITIVE_INFINITY

        if (firstTime !== secondTime) {
          return firstTime - secondTime
        }

        return a.slot - b.slot
      })

    for (const match of matches) {
      await tx.match.update({
        where: { id: match.id },
        data: { slot: match.slot + 1000 },
        select: { id: true },
      })
    }

    for (let index = 0; index < orderedMatches.length; index += 1) {
      const match = orderedMatches[index]
      await tx.match.update({
        where: { id: match.id },
        data: { slot: index + 1 },
        select: { id: true },
      })
    }

    const teams = await tx.team.findMany({
      where: { tournamentId: currentMatch.fecha.tournamentId },
      select: { id: true, name: true },
    })

    const updatedFecha = await tx.fecha.findUnique({
      where: { id: currentMatch.fechaId },
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
            scheduledAt: true,
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

    if (!updatedFecha) {
      return null
    }

    return {
      id: updatedFecha.id,
      number: updatedFecha.number,
      date: updatedFecha.date ? updatedFecha.date.toISOString().slice(0, 10) : null,
      status: updatedFecha.status,
      matches: updatedFecha.matches.map((match) => ({
        id: match.id,
        slot: match.slot,
        scheduledAt: match.scheduledAt?.toISOString() ?? null,
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
        (team) =>
          !updatedFecha.matches.some(
            (match) => match.teamOne.id === team.id || match.teamTwo.id === team.id
          )
      ),
    }
  })

  if (!fecha) {
    return { error: "La fecha no existe." }
  }

  return { success: true, fecha }
}

export async function deleteMatch(matchId: string) {
  if (!matchId) {
    return { error: "El partido es inválido." }
  }

  const currentMatch = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      fechaId: true,
      fecha: {
        select: {
          status: true,
          tournamentId: true,
        },
      },
    },
  })

  if (!currentMatch) {
    return { error: "El partido no existe." }
  }

  if (currentMatch.fecha.status === "CLOSED") {
    return { error: "La fecha está cerrada y sus partidos son de solo lectura." }
  }

  const fecha = await prisma.$transaction(async (tx) => {
    await tx.match.delete({
      where: { id: matchId },
      select: { id: true },
    })

    const matches = await tx.match.findMany({
      where: { fechaId: currentMatch.fechaId },
      select: {
        id: true,
        slot: true,
        scheduledAt: true,
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

    const teams = await tx.team.findMany({
      where: { tournamentId: currentMatch.fecha.tournamentId },
      select: { id: true, name: true },
    })

    const updatedFecha = await tx.fecha.findUnique({
      where: { id: currentMatch.fechaId },
      select: {
        id: true,
        number: true,
        date: true,
        status: true,
      },
    })

    if (!updatedFecha) {
      return null
    }

    return {
      id: updatedFecha.id,
      number: updatedFecha.number,
      date: updatedFecha.date ? updatedFecha.date.toISOString().slice(0, 10) : null,
      status: updatedFecha.status,
      matches: matches
        .slice()
        .sort((a, b) => {
          const firstTime = a.scheduledAt ? a.scheduledAt.getTime() : Number.POSITIVE_INFINITY
          const secondTime = b.scheduledAt ? b.scheduledAt.getTime() : Number.POSITIVE_INFINITY

          if (firstTime !== secondTime) {
            return firstTime - secondTime
          }

          return a.slot - b.slot
        })
        .map((match) => ({
          id: match.id,
          slot: match.slot,
          scheduledAt: match.scheduledAt?.toISOString() ?? null,
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
        (team) =>
          !matches.some((match) => match.teamOne.id === team.id || match.teamTwo.id === team.id)
      ),
    }
  })

  if (!fecha) {
    return { error: "La fecha no existe." }
  }

  return { success: true, fecha }
}

export async function updateMatchScheduledTime(matchId: string, time: string) {
  if (!matchId) {
    return { error: "El partido es inválido." }
  }

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return { error: "Ingresá una hora válida." }
  }

  const currentMatch = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      fechaId: true,
      fecha: {
        select: {
          date: true,
          status: true,
        },
      },
    },
  })

  if (!currentMatch) {
    return { error: "El partido no existe." }
  }

  if (currentMatch.fecha.status === "CLOSED") {
    return { error: "La fecha está cerrada y sus partidos son de solo lectura." }
  }

  const date = currentMatch.fecha.date?.toISOString().slice(0, 10)
  if (!date) {
    return { error: "Seleccioná un día para la fecha antes de asignar horarios." }
  }

  const scheduledAt = buildLocalDateTime(date, time)
  if (!scheduledAt) {
    return { error: "La hora ingresada no es válida." }
  }

  const updatedMatch = await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: { scheduledAt },
      select: { id: true },
    })

    const matches = await tx.match.findMany({
      where: { fechaId: currentMatch.fechaId },
      select: {
        id: true,
        slot: true,
        scheduledAt: true,
        status: true,
        teamOneScore: true,
        teamTwoScore: true,
        teamOne: {
          select: { id: true, name: true },
        },
        teamTwo: {
          select: { id: true, name: true },
        },
      },
    })

    const orderedMatches = matches
      .slice()
      .sort((a, b) => {
        const firstTime = a.scheduledAt ? a.scheduledAt.getTime() : Number.POSITIVE_INFINITY
        const secondTime = b.scheduledAt ? b.scheduledAt.getTime() : Number.POSITIVE_INFINITY

        if (firstTime !== secondTime) {
          return firstTime - secondTime
        }

        return a.slot - b.slot
      })

    for (const match of matches) {
      await tx.match.update({
        where: { id: match.id },
        data: { slot: match.slot + 1000 },
        select: { id: true },
      })
    }

    for (let index = 0; index < orderedMatches.length; index += 1) {
      const match = orderedMatches[index]
      await tx.match.update({
        where: { id: match.id },
        data: { slot: index + 1 },
        select: { id: true },
      })
    }

    return tx.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        slot: true,
        scheduledAt: true,
      },
    })
  })

  if (!updatedMatch) {
    return { error: "El partido no existe." }
  }

  return {
    success: true,
    match: {
      id: updatedMatch.id,
      slot: updatedMatch.slot,
      scheduledAt: updatedMatch.scheduledAt?.toISOString() ?? null,
    },
  }
}

export async function toggleMatchStatus(matchId: string) {
  if (!matchId) {
    return { error: "El partido es inválido." }
  }

  const currentMatch = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      status: true,
      fecha: { select: { status: true } },
    },
  })

  if (!currentMatch) {
    return { error: "El partido no existe." }
  }

  if (currentMatch.fecha.status === "CLOSED") {
    return { error: "La fecha está cerrada y sus partidos son de solo lectura." }
  }

  const nextStatus = currentMatch.status === "IN_PROGRESS" ? "COMPLETED" : "IN_PROGRESS"
  const match = await prisma.match.update({
    where: { id: matchId },
    data: { status: nextStatus },
    select: { id: true, status: true },
  })

  revalidatePath(`/campeonato`)
  return { success: true, match }
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

  const parsedDate = buildLocalDateTime(date, "12:00")!

  const fecha = await prisma.$transaction(async (tx) => {
    const matches = await tx.match.findMany({
      where: { fechaId, scheduledAt: { not: null } },
      select: { id: true, scheduledAt: true },
    })

    for (const match of matches) {
      const scheduledTime = [
        String(match.scheduledAt!.getHours()).padStart(2, "0"),
        String(match.scheduledAt!.getMinutes()).padStart(2, "0"),
      ].join(":")
      await tx.match.update({
        where: { id: match.id },
        data: { scheduledAt: buildLocalDateTime(date, scheduledTime)! },
      })
    }

    return tx.fecha.update({
      where: { id: fechaId },
      data: { date: parsedDate },
      select: {
        id: true,
        number: true,
        date: true,
      },
    })
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

  const currentFecha = await prisma.fecha.findUnique({
    where: { id: fechaId },
    select: { date: true },
  })

  if (!currentFecha) {
    return { error: "La fecha no existe." }
  }

  if (!currentFecha.date) {
    return { error: "Seleccioná un día para la fecha antes de cerrarla." }
  }

  const fecha = await prisma.$transaction(async (tx) => {
    await tx.match.updateMany({
      where: {
        fechaId,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      },
      data: { status: "COMPLETED" },
    })

    return tx.fecha.update({
      where: { id: fechaId },
      data: { status: "CLOSED" },
      select: {
        id: true,
        status: true,
      },
    })
  })

  revalidatePath(`/campeonato`)
  return { success: true, fecha }
}

export async function reopenFecha(fechaId: string) {
  if (!fechaId) {
    return { error: "La fecha es inválida." }
  }

  const currentFecha = await prisma.fecha.findUnique({
    where: { id: fechaId },
    select: { status: true },
  })

  if (!currentFecha) {
    return { error: "La fecha no existe." }
  }

  if (currentFecha.status !== "CLOSED") {
    return { error: "Solo se pueden reabrir fechas cerradas." }
  }

  const fecha = await prisma.fecha.update({
    where: { id: fechaId },
    data: { status: "OPEN" },
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
