"use client"

import { useState } from "react"
import { CalendarDays, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteFecha, generateFecha, updateMatchResult, type FixtureDate } from "../actions"

interface FixtureListProps {
  tournamentId: string
  initialFechas: FixtureDate[]
}

function formatFechaDay(fechaNumber: number) {
  const baseDate = new Date()
  baseDate.setHours(0, 0, 0, 0)
  baseDate.setDate(baseDate.getDate() + (fechaNumber - 1) * 7)

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(baseDate)
}

function formatTeamName(name: string) {
  return name.replace(/\b\w/g, (char) => char.toUpperCase())
}

export function FixtureList({ tournamentId, initialFechas }: FixtureListProps) {
  const [fechas, setFechas] = useState(initialFechas)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerateFecha() {
    setError(null)
    setIsGenerating(true)

    const result = await generateFecha(tournamentId)

    setIsGenerating(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    if (result?.fecha) {
      setFechas((current) => [...current, result.fecha])
    }
  }

  async function handleMatchChange(matchId: string, result: { teamOneScore: number; teamTwoScore: number }) {
    const response = await updateMatchResult(matchId, result)

    if (response?.error) {
      setError(response.error)
      return
    }

    if (response?.match) {
      setFechas((current) =>
        current.map((fecha) => ({
          ...fecha,
          matches: fecha.matches.map((match) =>
            match.id === matchId
              ? {
                  ...match,
                  ...response.match,
                  status: response.match.status,
                  teamOneScore: response.match.teamOneScore,
                  teamTwoScore: response.match.teamTwoScore,
                }
              : match
          ),
        }))
      )
    }
  }

  async function handleDeleteFecha(fechaId: string) {
    const confirmed = window.confirm("¿Seguro que querés eliminar esta fecha? Se borrarán todos sus partidos.")

    if (!confirmed) {
      return
    }

    const response = await deleteFecha(fechaId)

    if (response?.error) {
      setError(response.error)
      return
    }

    setFechas((current) => current.filter((fecha) => fecha.id !== fechaId))
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Fixture</h2>
        </div>

        <Button type="button" onClick={handleGenerateFecha} disabled={isGenerating}>
          {isGenerating ? "Generando..." : "Generar fecha"}
        </Button>
      </div>

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {fechas.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Todavía no hay fechas creadas para este torneo.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {fechas
            .slice()
            .sort((a, b) => a.number - b.number)
            .map((fecha) => (
              <div key={fecha.id} className="rounded-xl border bg-muted/20 p-4">
                <div className="mb-4 flex items-center justify-between gap-3 border-b pb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Fecha
                    </p>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold">{fecha.number}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                          fecha.status === "CLOSED"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {fecha.status === "CLOSED" ? "Cerrada" : "Abierta"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Día</p>
                    <span>{formatFechaDay(fecha.number)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {fecha.matches
                    .slice()
                    .sort((a, b) => a.slot - b.slot)
                    .map((match) => (
                      <div
                        key={match.id}
                        className="flex flex-col gap-3 rounded-lg border bg-background p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 flex-1 text-left text-sm font-medium text-foreground">
                            {formatTeamName(match.teamOne.name)}
                          </span>

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              defaultValue={match.teamOneScore ?? ""}
                              onBlur={(event) => {
                                const value = Number(event.target.value)
                                if (Number.isNaN(value)) return

                                handleMatchChange(match.id, {
                                  teamOneScore: value,
                                  teamTwoScore: Number(match.teamTwoScore ?? 0),
                                })
                              }}
                              className="h-9 w-12 rounded-md border bg-background px-1 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              placeholder="0"
                            />
                            <span className="text-muted-foreground">:</span>
                            <input
                              type="number"
                              min={0}
                              defaultValue={match.teamTwoScore ?? ""}
                              onBlur={(event) => {
                                const value = Number(event.target.value)
                                if (Number.isNaN(value)) return

                                handleMatchChange(match.id, {
                                  teamOneScore: Number(match.teamOneScore ?? 0),
                                  teamTwoScore: value,
                                })
                              }}
                              className="h-9 w-12 rounded-md border bg-background px-1 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              placeholder="0"
                            />
                          </div>

                          <span className="min-w-0 flex-1 text-right text-sm font-medium text-foreground">
                            {formatTeamName(match.teamTwo.name)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="mt-4 border-t pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDeleteFecha(fecha.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar fecha
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
