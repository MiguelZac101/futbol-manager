"use client"

import Link from "next/link"
import { FlaskConical, Trophy, Plus } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface Tournament {
  id: string
  name: string
  imageUrl?: string | null
}

interface TournamentListProps {
  tournaments: Tournament[]
  demoTournament: Tournament | null
  onCreate?: () => void
}

export function TournamentList({
  tournaments,
  demoTournament,
  onCreate,
}: TournamentListProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
      {/* Card para crear nuevo campeonato */}
      <button
        onClick={onCreate}
        title="Crear nuevo campeonato"
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 p-6 h-full min-h-45 hover:bg-muted/40 hover:border-muted-foreground/50 transition-colors cursor-pointer"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Plus className="h-8 w-8 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          Campeonato
        </span>
      </button>

      {demoTournament ? (
        <Link
          href="/campeonato/demo"
          title="Probar campeonato demo"
          className="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-6 h-full min-h-45 transition-colors hover:bg-primary/10 cursor-pointer"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <FlaskConical className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1 text-center">
            <span className="block text-sm font-medium">{demoTournament.name}</span>
            <span className="block text-xs text-muted-foreground">
              Probar demo privada
            </span>
          </div>
        </Link>
      ) : null}

      {/* Cards de campeonatos existentes */}
      {
        tournaments.map((tournament) => {
        return (
        <div
          key={tournament.id}
          className={cn(
              "group flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card p-6 h-full min-h-45 transition-all duration-200 ease-out hover:border-primary/50 hover:shadow-sm hover:bg-accent/20",
            )}
        >
          <Link
            href={`/campeonato/${tournament.id}`}
            title={`Ir a ${tournament.name}`}
            className="flex w-full flex-col items-center gap-3 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted overflow-hidden relative ">
              {tournament.imageUrl ? (
                <Image
                  src={tournament.imageUrl}
                  alt={tournament.name}
                  className="h-full w-full object-cover"
                  fill                
                />
              ) : (
                <Trophy className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            <span className="text-sm font-medium text-center line-clamp-2">
              {tournament.name}
            </span>
          </Link>
        </div>
        )
        })
      }
    </div>
  )
}