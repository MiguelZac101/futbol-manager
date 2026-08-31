import Image from "next/image"
import { notFound } from "next/navigation"
import { Trophy, MapPin, User, Users, CalendarDays } from "lucide-react"
import { prisma } from "@/lib/prisma"
import {
  getTournamentStandings,
  getTournamentFechas,
  getTournamentTeams,
} from "@/app/(dashboard)/campeonato/[id]/actions"
import { StandingsTable } from "@/app/(dashboard)/campeonato/[id]/components/StandingsTable"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    select: { name: true },
  })

  return {
    title: tournament?.name ?? "Campeonato",
  }
}

function formatTeamName(name: string) {
  return name.replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatFechaDate(date: string | null) {
  if (!date) return null
  const parsed = new Date(`${date}T00:00:00`)
  return parsed.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
}

export default async function PublicTournamentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      defaultVenue: { select: { name: true, address: true } },
      defaultReferee: { select: { name: true } },
    },
  })

  if (!tournament) {
    notFound()
  }

  const [standings, fechas, teams] = await Promise.all([
    getTournamentStandings(tournament.id),
    getTournamentFechas(tournament.id),
    getTournamentTeams(tournament.id),
  ])

  const upcomingFechas = fechas.filter((fecha) =>
    fecha.matches.some((match) => match.status !== "COMPLETED")
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted/20 flex items-center justify-center">
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
              <p className="text-sm text-muted-foreground">Campeonato</p>
              <h1 className="text-3xl font-bold tracking-tight">{tournament.name}</h1>
              {(tournament.defaultReferee || tournament.defaultVenue) ? (
                <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
                  {tournament.defaultReferee ? (
                    <span className="flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      {tournament.defaultReferee.name}
                    </span>
                  ) : null}
                  {tournament.defaultVenue ? (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {tournament.defaultVenue.address}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <StandingsTable standings={standings} />
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Equipos</h2>
            </div>

            {teams.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Todavía no hay equipos registrados.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {teams.map((team) => (
                  <div key={team.id} className="flex flex-col items-center gap-2 text-center">
                    <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-muted/20">
                      {team.imageUrl ? (
                        <Image
                          src={team.imageUrl}
                          alt={team.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <Trophy className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-xs font-medium line-clamp-2">
                      {formatTeamName(team.name)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl border bg-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Próximos partidos</h2>
          </div>

          {upcomingFechas.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No hay partidos programados por el momento.
            </div>
          ) : (
            <div className="space-y-6">
              {upcomingFechas.map((fecha) => (
                <div key={fecha.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Fecha {fecha.number}</h3>
                    {fecha.date ? (
                      <span className="text-xs text-muted-foreground">
                        {formatFechaDate(fecha.date)}
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    {fecha.matches
                      .filter((match) => match.status !== "COMPLETED")
                      .map((match) => (
                        <div
                          key={match.id}
                          className="flex items-center justify-between rounded-lg border p-3 text-sm"
                        >
                          <span className="font-medium">
                            {formatTeamName(match.teamOne.name)} vs {formatTeamName(match.teamTwo.name)}
                          </span>
                          {match.scheduledAt ? (
                            <span className="text-xs text-muted-foreground">
                              {new Date(match.scheduledAt).toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          ) : null}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Futbol Manager · Gestión de campeonatos relámpago de barrio
        </p>
      </div>
    </div>
  )
}
