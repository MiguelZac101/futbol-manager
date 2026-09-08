import { prisma } from "@/lib/prisma"
import { ensureLocalUser } from "@/lib/current-user"

export const DEMO_TOURNAMENT_KEY = "main"
export const DEMO_WORKSPACE_TTL_MS = 24 * 60 * 60 * 1000

function getExpirationDate(now: Date) {
  return new Date(now.getTime() + DEMO_WORKSPACE_TTL_MS)
}

export async function getOrCreateDemoWorkspace() {
  const [user, templateTournament] = await Promise.all([
    ensureLocalUser(),
    prisma.tournament.findUnique({
      where: { demoKey: DEMO_TOURNAMENT_KEY },
      select: { id: true, name: true },
    }),
  ])

  if (!templateTournament) {
    throw new Error("La plantilla del campeonato demo no está disponible.")
  }

  const now = new Date()
  const existingWorkspace = await prisma.demoWorkspace.findUnique({
    where: {
      userId_templateTournamentId: {
        userId: user.id,
        templateTournamentId: templateTournament.id,
      },
    },
    select: { expiresAt: true },
  })
  const isExpired = existingWorkspace
    ? existingWorkspace.expiresAt.getTime() <= now.getTime()
    : false

  const workspace = await prisma.demoWorkspace.upsert({
    where: {
      userId_templateTournamentId: {
        userId: user.id,
        templateTournamentId: templateTournament.id,
      },
    },
    update: {
      lastActiveAt: now,
      expiresAt: getExpirationDate(now),
    },
    create: {
      userId: user.id,
      templateTournamentId: templateTournament.id,
      lastActiveAt: now,
      expiresAt: getExpirationDate(now),
    },
    select: {
      id: true,
      expiresAt: true,
      lastActiveAt: true,
    },
  })

  return {
    workspace,
    templateTournament,
    isNewOrExpired: !existingWorkspace || isExpired,
  }
}
