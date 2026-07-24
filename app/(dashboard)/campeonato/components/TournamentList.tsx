"use client"

import { Trophy, Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface Tournament {
  id: string
  name: string
  imageUrl?: string | null
}

interface TournamentListProps {
  tournaments: Tournament[]
  onCreate?: () => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function TournamentList({
  tournaments,
  onCreate,
  onEdit,
  onDelete,
}: TournamentListProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
      {/* Card para crear nuevo campeonato */}
      <button
        onClick={onCreate}
        title="Crear nuevo campeonato"
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 p-6 h-full min-h-[180px] hover:bg-muted/40 hover:border-muted-foreground/50 transition-colors cursor-pointer"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Plus className="h-8 w-8 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          Nuevo Campeonato
        </span>
      </button>

      {/* Cards de campeonatos existentes */}
      {tournaments.map((tournament) => (
        <div
          key={tournament.id}
          className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 h-full min-h-[180px]"
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

          <div className="flex gap-2 mt-auto pt-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit?.(tournament.id)}
              aria-label={`Editar ${tournament.name}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete?.(tournament.id)}
              aria-label={`Eliminar ${tournament.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}