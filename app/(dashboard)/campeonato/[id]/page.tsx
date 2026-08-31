import Link from "next/link"
import Image from "next/image"
import { Trophy, Calendar, Trophy as TrophyIcon, BarChart3, Users } from "lucide-react"
import { prisma } from "@/lib/prisma"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

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

  const tournament = await prisma.tournament.findUnique({
    where: { id },
  })

  if (!tournament) {
    return <div className="p-6">Campeonato no encontrado.</div>
  }

  const sections: SectionCard[] = [
    {
      id: "fechas",
      title: "Fechas",
      description: "Configurar y gestionar las fechas del torneo",
      icon: <Calendar className="h-8 w-8" />,
      href: `/campeonato/${id}/fechas`,
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

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Detalle del campeonato</p>
            <h1 className="text-3xl font-bold tracking-tight">{tournament.name}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className="group relative overflow-hidden rounded-xl border border-border/70 bg-card p-6 transition-all hover:border-primary/50 hover:shadow-md hover:bg-accent/20 cursor-pointer"
          >
            <div className="flex flex-col gap-3">
              <div className="text-muted-foreground group-hover:text-primary transition-colors">
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
