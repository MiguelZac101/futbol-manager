// app/(dashboard)/campeonato/page.tsx
import { prisma } from "@/lib/prisma"
import { CampeonatoClient } from "./components/CampeonatoClient"

export default async function CampeonatoPage() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
  })

  return <CampeonatoClient tournaments={tournaments} />
}