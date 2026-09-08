// app/(dashboard)/campeonato/page.tsx
import { prisma } from "@/lib/prisma"
import { CampeonatoClient } from "./components/CampeonatoClient"
import { getOrganizerVenues, getOrganizerReferees } from "./actions"
import { ensureLocalUser } from "@/lib/current-user"

export default async function CampeonatoPage() {
  const organizer = await ensureLocalUser()
  const now = new Date()
  const [tournaments, demoTournament, activeDemoWorkspace] = await Promise.all([
    prisma.tournament.findMany({
      where: { demoKey: null, isDemoSandbox: false, organizerId: organizer.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tournament.findUnique({
      where: { demoKey: "main" },
      select: {
        id: true,
        name: true,
        imageUrl: true,
      },
    }),
    prisma.demoWorkspace.findFirst({
      where: {
        userId: organizer.id,
        expiresAt: { gt: now },
        sandboxTournamentId: { not: null },
      },
      select: { sandboxTournamentId: true },
    }),
  ])
  const venues = await getOrganizerVenues()
  const referees = await getOrganizerReferees()

  return (
    <CampeonatoClient
      tournaments={tournaments}
      demoTournament={demoTournament}
      activeDemoSandboxId={activeDemoWorkspace?.sandboxTournamentId ?? null}
      venues={venues}
      referees={referees}
    />
  )
}