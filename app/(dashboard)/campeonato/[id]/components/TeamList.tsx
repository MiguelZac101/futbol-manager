"use client"

import { useState } from "react"
import { Plus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { createTeam } from "../actions"

interface Team {
  id: string
  name: string
  imageUrl?: string | null
}

interface TeamListProps {
  tournamentId: string
  initialTeams: Team[]
}

export function TeamList({ tournamentId, initialTeams }: TeamListProps) {
  const [teams, setTeams] = useState(initialTeams)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Ingresá el nombre del equipo")
      return
    }

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("name", name.trim())

    const result = await createTeam(tournamentId, formData)

    if (result?.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    if (result?.team) {
      setTeams((current) => [result.team, ...current])
    }

    setName("")
    setOpen(false)
    setIsSubmitting(false)
  }

  return (
    <>
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Equipos</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            title="Crear nuevo equipo"
            className="flex h-full min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 p-6 transition-colors hover:bg-muted/40 hover:border-muted-foreground/50 cursor-pointer"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Equipo</span>
          </button>

          {teams.map((team) => (
            <div
              key={team.id}
              className="flex h-full min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-border/70 bg-card p-6"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground">
                {team.name.slice(0, 2)}
              </div>
              <span className="text-sm font-medium text-center line-clamp-2">{team.name}</span>
            </div>
          ))}
        </div>

        {teams.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Todavía no hay equipos en este torneo.
          </div>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar equipo</DialogTitle>
            <DialogDescription>
              Crea un equipo para este campeonato. Queda asociado solo a este torneo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="team-name" className="text-sm font-medium">
                Nombre del equipo
              </label>
              <Input
                id="team-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="River Plate"
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar equipo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
