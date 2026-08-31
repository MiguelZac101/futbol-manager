// app/(dashboard)/campeonato/page.tsx
import { prisma } from "@/lib/prisma"
import { CampeonatoClient } from "./components/CampeonatoClient"
import { getOrganizerVenues, getOrganizerReferees } from "./actions"

export default async function CampeonatoPage() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
  })
  const venues = await getOrganizerVenues()
  const referees = await getOrganizerReferees()

  return <CampeonatoClient tournaments={tournaments} venues={venues} referees={referees} />
}