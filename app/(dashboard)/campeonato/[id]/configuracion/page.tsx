import Link from "next/link"
import Image from "next/image"
import { Trophy } from "lucide-react"
import { prisma } from "@/lib/prisma"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { FechaConfiguration } from "../components/FechaConfiguration"
import { getTournamentFechas } from "../actions"
import { authorizeTournamentRead } from "@/lib/demo-workspace"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await authorizeTournamentRead(id)
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { name: true },
  })

  return {
    title: `${tournament?.name ?? "Campeonato"} - Configuración`,
  }
}

export default async function TournamentConfiguracionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await authorizeTournamentRead(id)

  const tournament = await prisma.tournament.findUnique({
    where: { id },
  })

  if (!tournament) {
    return <div className="p-6">Campeonato no encontrado.</div>
  }

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
            <BreadcrumbLink asChild>
              <Link href={`/campeonato/${id}`}>{tournament.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Configuración</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-full bg-muted/20 flex items-center justify-center">
            {tournament.imageUrl ? (
              <Image
                src={tournament.imageUrl}
                alt={tournament.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <Trophy className="h-10 w-10 text-muted-foreground" />
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Configuración del campeonato</p>
            <h1 className="text-3xl font-bold tracking-tight">{tournament.name}</h1>
          </div>
        </div>
      </div>

      <div className="w-full">
        <FechaConfiguration
          tournamentId={id}
          fechas={fechas}
          initialFixtureStartTime={tournament.fixtureStartTime}
          initialMatchIntervalMinutes={tournament.matchIntervalMinutes}
        />
      </div>
    </div>
  )
}
