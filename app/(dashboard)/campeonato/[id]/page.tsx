import Link from "next/link"
import { prisma } from "@/lib/prisma"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { TeamList } from "./components/TeamList"
import { FixtureList } from "./components/FixtureList"
import { getTournamentFechas, getTournamentTeams } from "./actions"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { name: true },
  })

  return {
    title: tournament?.name ?? "Campeonato",
  }
}

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const tournament = await prisma.tournament.findUnique({
    where: { id },
  })

  if (!tournament) {
    return <div className="p-6">Campeonato no encontrado.</div>
  }

  const teams = await getTournamentTeams(id)
  const fechas = await getTournamentFechas(id)

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/campeonato">Campeonatos</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{tournament.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Detalle del campeonato</p>
        <h1 className="text-3xl font-bold tracking-tight">{tournament.name}</h1>
      </div>

      <div className="space-y-6">
        <div className="w-full">
          <FixtureList tournamentId={id} initialFechas={fechas} />
        </div>

        <div className="w-full">
          <TeamList tournamentId={id} initialTeams={teams} />
        </div>
      </div>
    </div>
  )
}
