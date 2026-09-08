import { prisma } from "@/lib/prisma"
import { ensureLocalUser } from "@/lib/current-user"
import { randomUUID } from "node:crypto"

export const DEMO_TOURNAMENT_KEY = "main"
export const DEMO_WORKSPACE_TTL_MS = 24 * 60 * 60 * 1000

function getExpirationDate(now: Date) {
  return new Date(now.getTime() + DEMO_WORKSPACE_TTL_MS)
}

export async function getDemoTemplate() {
  const templateTournament = await prisma.tournament.findUnique({
    where: { demoKey: DEMO_TOURNAMENT_KEY },
    select: { id: true, name: true },
  })

  if (!templateTournament) {
    throw new Error("La plantilla del campeonato demo no está disponible.")
  }

  return templateTournament
}

async function cloneTemplateIntoSandbox(
  userId: string,
  templateTournamentId: string,
  sandboxTournamentId: string
) {
  const template = await prisma.tournament.findUnique({
    where: { id: templateTournamentId },
    include: {
      teams: {
        include: {
          players: true,
        },
      },
      fechas: {
        include: {
          matches: true,
        },
      },
    },
  })

  if (!template || template.demoKey !== DEMO_TOURNAMENT_KEY) {
    throw new Error("La plantilla del campeonato demo no está disponible.")
  }

  await prisma.$transaction(async (tx) => {
    const sandboxTournament = await tx.tournament.create({
      data: {
        id: sandboxTournamentId,
        name: template.name,
        slug: `demo-sandbox-${sandboxTournamentId}`,
        imageUrl: template.imageUrl,
        status: template.status,
        tiebreakerCriteria: template.tiebreakerCriteria,
        startDate: template.startDate,
        fixtureStartTime: template.fixtureStartTime,
        matchIntervalMinutes: template.matchIntervalMinutes,
        organizerId: userId,
        isDemoSandbox: true,
      },
    })

    const teamIdMap = new Map<string, string>()

    for (const team of template.teams) {
      const sandboxTeam = await tx.team.create({
        data: {
          name: team.name,
          imageUrl: team.imageUrl,
          tournamentId: sandboxTournament.id,
          players: {
            create: team.players.map((player) => ({
              name: player.name,
              dni: player.dni,
              photoUrl: player.photoUrl,
            })),
          },
        },
      })
      teamIdMap.set(team.id, sandboxTeam.id)
    }

    for (const fecha of template.fechas) {
      const sandboxFecha = await tx.fecha.create({
        data: {
          number: fecha.number,
          date: fecha.date,
          status: fecha.status,
          generationMethod: fecha.generationMethod,
          tournamentId: sandboxTournament.id,
        },
      })

      for (const match of fecha.matches) {
        const teamOneId = teamIdMap.get(match.teamOneId)
        const teamTwoId = teamIdMap.get(match.teamTwoId)

        if (!teamOneId || !teamTwoId) {
          throw new Error("La plantilla demo contiene un partido con equipos inválidos.")
        }

        await tx.match.create({
          data: {
            status: match.status,
            slot: match.slot,
            scheduledAt: match.scheduledAt,
            teamOneScore: match.teamOneScore,
            teamTwoScore: match.teamTwoScore,
            wasSwapped: match.wasSwapped,
            fechaId: sandboxFecha.id,
            teamOneId,
            teamTwoId,
          },
        })
      }
    }
  })
}

export async function getDemoContext() {
  const [user, templateTournament] = await Promise.all([ensureLocalUser(), getDemoTemplate()])

  const now = new Date()
  const existingWorkspace = await prisma.demoWorkspace.findUnique({
    where: {
      userId_templateTournamentId: {
        userId: user.id,
        templateTournamentId: templateTournament.id,
      },
    },
    select: {
      id: true,
      expiresAt: true,
      sandboxTournamentId: true,
    },
  })
  const isExpired = existingWorkspace
    ? existingWorkspace.expiresAt.getTime() <= now.getTime()
    : true

  if (!existingWorkspace) {
    await prisma.demoWorkspace.create({
      data: {
        userId: user.id,
        templateTournamentId: templateTournament.id,
        lastActiveAt: now,
        expiresAt: getExpirationDate(now),
      },
    })
  }

  if (existingWorkspace?.sandboxTournamentId && !isExpired) {
    const workspace = await prisma.demoWorkspace.update({
      where: { id: existingWorkspace.id },
      data: {
        lastActiveAt: now,
        expiresAt: getExpirationDate(now),
      },
      select: {
        id: true,
        expiresAt: true,
        lastActiveAt: true,
        sandboxTournamentId: true,
      },
    })

    return {
      workspace,
      templateTournament,
      isNewOrExpired: false,
    }
  }

  if (existingWorkspace?.sandboxTournamentId) {
    await prisma.demoWorkspace.update({
      where: { id: existingWorkspace.id },
      data: { sandboxTournamentId: null },
    })

    await prisma.tournament.delete({
      where: { id: existingWorkspace.sandboxTournamentId },
    })
  }

  const sandboxTournamentId = randomUUID()
  await cloneTemplateIntoSandbox(user.id, templateTournament.id, sandboxTournamentId)

  const workspace = await prisma.demoWorkspace.update({
    where: {
      userId_templateTournamentId: {
        userId: user.id,
        templateTournamentId: templateTournament.id,
      },
    },
    data: {
      lastActiveAt: now,
      expiresAt: getExpirationDate(now),
      sandboxTournamentId,
    },
    select: {
      id: true,
      expiresAt: true,
      lastActiveAt: true,
      sandboxTournamentId: true,
    },
  })

  return {
    workspace,
    templateTournament,
    isNewOrExpired: true,
  }
}

export const getOrCreateDemoWorkspace = getDemoContext

export async function touchDemoWorkspace(workspaceId: string) {
  const user = await ensureLocalUser()
  const now = new Date()
  const expiresAt = getExpirationDate(now)
  const update = await prisma.demoWorkspace.updateMany({
    where: {
      id: workspaceId,
      userId: user.id,
      expiresAt: { gt: now },
    },
    data: {
      lastActiveAt: now,
      expiresAt,
    },
  })

  if (update.count !== 1) {
    throw new Error("El espacio demo no existe, venció o no te pertenece.")
  }

  return { expiresAt, lastActiveAt: now }
}

export async function getAuthorizedDemoSandbox(sandboxTournamentId: string) {
  const user = await ensureLocalUser()
  const now = new Date()
  const workspace = await prisma.demoWorkspace.findFirst({
    where: {
      userId: user.id,
      sandboxTournamentId,
      expiresAt: { gt: now },
    },
    select: {
      id: true,
      sandboxTournament: {
        select: {
          id: true,
          name: true,
          isDemoSandbox: true,
        },
      },
    },
  })

  if (!workspace?.sandboxTournament || !workspace.sandboxTournament.isDemoSandbox) {
    throw new Error("El espacio demo no existe, venció o no te pertenece.")
  }

  const activity = await touchDemoWorkspace(workspace.id)

  return {
    workspace: {
      id: workspace.id,
      ...activity,
    },
    sandboxTournament: workspace.sandboxTournament,
  }
}

export async function authorizeTournamentRead(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { isDemoSandbox: true },
  })

  if (!tournament) {
    return false
  }

  if (tournament.isDemoSandbox) {
    await getAuthorizedDemoSandbox(tournamentId)
  }

  return true
}

export async function authorizeTournamentMutation(tournamentId: string) {
  const [user, tournament] = await Promise.all([
    ensureLocalUser(),
    prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { organizerId: true, isDemoSandbox: true },
    }),
  ])

  if (!tournament) {
    throw new Error("El campeonato no existe.")
  }

  if (tournament.isDemoSandbox) {
    await getAuthorizedDemoSandbox(tournamentId)
    return
  }

  if (tournament.organizerId !== user.id) {
    throw new Error("No tenés permiso para modificar este campeonato.")
  }
}
