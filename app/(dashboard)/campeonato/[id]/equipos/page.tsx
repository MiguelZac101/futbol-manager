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
import { TeamList } from "../components/TeamList"
import { getTournamentTeams } from "../actions"
import { authorizeTournamentRead } from "@/lib/demo-workspace"
import { getAuthorizedDemoSandbox } from "@/lib/demo-workspace"
import { DemoSandboxNotice } from "../components/DemoSandboxNotice"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await authorizeTournamentRead(id)
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { name: true },
  })

  return {
    title: `${tournament?.name ?? "Campeonato"} - Equipos`,
  }
}

export default async function TournamentEquiposPage({
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
    return <div>Campeonato no encontrado.</div>
  }
  const demoContext = tournament.isDemoSandbox
    ? await getAuthorizedDemoSandbox(id)
    : null

  const teams = await getTournamentTeams(id)

  return (
    <div className="space-y-6">
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
            <BreadcrumbPage>Equipos</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {demoContext ? <DemoSandboxNotice expiresAt={demoContext.workspace.expiresAt} /> : null}

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
            <p className="text-sm text-muted-foreground">Equipos del campeonato</p>
            <h1 className="text-3xl font-bold tracking-tight">{tournament.name}</h1>
          </div>
        </div>
      </div>

      <div className="w-full">
        <TeamList tournamentId={id} initialTeams={teams} />
      </div>
    </div>
  )
}
