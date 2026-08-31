import Link from "next/link"
import Image from "next/image"
import { Trophy, MapPin, Users, User, Plus, ArrowRight } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth, currentUser } from "@clerk/nextjs/server"

async function getLocalUser() {
  const { userId } = await auth()
  if (!userId) return null

  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress ?? ""
  const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "Usuario"

  let localUser = await prisma.user.findUnique({ where: { clerkId: userId } })

  if (!localUser) {
    localUser = await prisma.user.create({
      data: {
        clerkId: userId,
        name: fullName,
        email: primaryEmail || `${userId}@local.clerk`,
        imageUrl: clerkUser.imageUrl || null,
      },
    })
  }

  return localUser
}

export default async function Page() {
  const localUser = await getLocalUser()

  const [tournamentCount, venueCount, refereeCount, recentTournaments] = localUser
    ? await Promise.all([
        prisma.tournament.count({ where: { organizerId: localUser.id } }),
        prisma.venue.count({ where: { ownerId: localUser.id } }),
        prisma.referee.count({ where: { ownerId: localUser.id } }),
        prisma.tournament.findMany({
          where: { organizerId: localUser.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            defaultVenue: { select: { name: true, address: true } },
            defaultReferee: { select: { name: true } },
          },
        }),
      ])
    : [0, 0, 0, []]

  const summaryCards = [
    { title: "Campeonatos", value: tournamentCount, icon: <Trophy className="h-6 w-6" />, href: "/campeonato" },
    { title: "Canchas", value: venueCount, icon: <MapPin className="h-6 w-6" />, href: "/canchas" },
    { title: "Árbitros", value: refereeCount, icon: <Users className="h-6 w-6" />, href: "/arbitros" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group flex items-center gap-4 rounded-xl border border-border/70 bg-card p-6 transition-all hover:border-primary/50 hover:shadow-sm hover:bg-accent/20"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{card.value}</p>
              <p className="text-sm text-muted-foreground">{card.title}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Campeonatos recientes</h2>
          <Link href="/campeonato" className="text-sm text-muted-foreground hover:text-foreground">
            Ver todos
          </Link>
        </div>

        {recentTournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Todavía no creaste ningún campeonato.
            </p>
            <Link
              href="/campeonato"
              className="text-sm font-medium text-primary hover:underline"
            >
              Crear campeonato
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {recentTournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/campeonato/${tournament.id}`}
                className="group flex items-center justify-between gap-4 py-3 transition-colors hover:bg-accent/20 -mx-2 px-2 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted/20">
                    {tournament.imageUrl ? (
                      <Image
                        src={tournament.imageUrl}
                        alt={tournament.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <Trophy className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{tournament.name}</p>
                    {(tournament.defaultReferee || tournament.defaultVenue) ? (
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
                        {tournament.defaultReferee ? (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {tournament.defaultReferee.name}
                          </span>
                        ) : null}
                        {tournament.defaultVenue ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {tournament.defaultVenue.address}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
