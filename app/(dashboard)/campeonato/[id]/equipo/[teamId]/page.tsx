import Link from "next/link"
import Image from "next/image"
import prisma from "@/lib/prisma"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export async function generateMetadata({ params }: { params: Promise<{ id: string; teamId: string }> }) {
  const { teamId } = await params
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { name: true },
  })

  return {
    title: team?.name ?? "Equipo",
  }
}

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string; teamId: string }> }) {
  const { id, teamId } = await params

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      tournament: {
        select: {
          id: true,
          name: true,
        },
      },
      players: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          dni: true,
          photoUrl: true,
        },
      },
    },
  })

  if (!team) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Equipo no encontrado.</p>
      </div>
    )
  }

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
              <Link href={`/campeonato/${id}`}>{team.tournament.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{team.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-full bg-muted/20">
            {team.imageUrl ? (
              <Image
                src={team.imageUrl}
                alt={team.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-bold uppercase text-muted-foreground">
                {team.name.slice(0, 1)}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Equipo</p>
            <h1 className="text-3xl font-bold tracking-tight">{team.name}</h1>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Jugadores</h2>
          <span className="text-sm text-muted-foreground">{team.players.length}</span>
        </div>

        {team.players.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {team.players.map((player) => (
              <div key={player.id} className="rounded-lg border bg-muted/10 p-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted/20">
                    {player.photoUrl ? (
                      <Image
                        src={player.photoUrl}
                        alt={player.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-muted-foreground">
                        {player.name.slice(0, 1)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium">{player.name}</p>
                    <p className="text-xs text-muted-foreground">DNI: {player.dni}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Todavía no hay jugadores cargados en este equipo.</p>
        )}
      </div>
    </div>
  )
}
