import Link from "next/link"
import Image from "next/image"
import { Trophy, Settings, Trophy as TrophyIcon, BarChart3, Users, ArrowRight, MapPin, User } from "lucide-react"
import { prisma } from "@/lib/prisma"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { TournamentActions } from "./components/TournamentActions"
import { getOrganizerVenues, getOrganizerReferees } from "../actions"
import { authorizeTournamentRead } from "@/lib/demo-workspace"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await authorizeTournamentRead(id)
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { name: true },
  })

  return {
    title: tournament?.name ?? "Campeonato",
  }
}

interface SectionCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
}

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await authorizeTournamentRead(id)

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      defaultVenue: { select: { name: true, address: true } },
      defaultReferee: { select: { name: true } },
    },
  })

  if (!tournament) {
    return <div className="p-6">Campeonato no encontrado.</div>
  }

  const venues = await getOrganizerVenues()
  const referees = await getOrganizerReferees()

  const sections: SectionCard[] = [
    {
      id: "configuracion",
      title: "Configuración",
      description: "Configurar fechas, horarios y ajustes del torneo",
      icon: <Settings className="h-8 w-8" />,
      href: `/campeonato/${id}/configuracion`,
    },
    {
      id: "fixture",
      title: "Fixture",
      description: "Ver y gestionar los partidos del torneo",
      icon: <TrophyIcon className="h-8 w-8" />,
      href: `/campeonato/${id}/fixture`,
    },
    {
      id: "posiciones",
      title: "Tabla de Posiciones",
      description: "Ver la clasificación de los equipos",
      icon: <BarChart3 className="h-8 w-8" />,
      href: `/campeonato/${id}/posiciones`,
    },
    {
      id: "equipos",
      title: "Equipos",
      description: "Gestionar los equipos y jugadores",
      icon: <Users className="h-8 w-8" />,
      href: `/campeonato/${id}/equipos`,
    },
  ]

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

          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Detalle del campeonato</p>
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

            <TournamentActions
              tournament={{
                id: tournament.id,
                name: tournament.name,
                slug: tournament.slug,
                imageUrl: tournament.imageUrl,
                defaultVenueId: tournament.defaultVenueId,
                defaultRefereeId: tournament.defaultRefereeId,
              }}
              venues={venues}
              referees={referees}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {sections.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md hover:bg-accent/20 cursor-pointer"
          >
            <ArrowRight className="absolute top-4 right-4 h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />

            <div className="flex flex-1 flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                {section.icon}
              </div>
              <div>
                <h3 className="font-semibold text-base">{section.title}</h3>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
