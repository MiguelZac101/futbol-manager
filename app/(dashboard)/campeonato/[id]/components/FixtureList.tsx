"use client"

import { useEffect, useRef, useState } from "react"
import { CalendarDays, Clock3, Loader2, LockKeyhole, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  closeFecha,
  deleteFecha,
  deleteMatch,
  generateFecha,
  toggleMatchStatus,
  updateMatchDetails,
  updateFechaDate,
  type FixtureDate,
} from "../actions"

interface FixtureListProps {
  tournamentId: string
  initialFechas: FixtureDate[]
  teamCount: number
}

type FixtureMatch = FixtureDate["matches"][number]

type MatchDraft = {
  hour: string
  minute: string
  period: "AM" | "PM"
  teamOneScore: string
  teamTwoScore: string
}

function formatTeamName(name: string) {
  return name.replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatClosedFechaDate(date: string | null) {
  if (!date) {
    return "Sin fecha"
  }

  const [year, month, day] = date.split("-")
  return `${day}/${month}/${year}`
}

function formatMatchTime(scheduledAt: string | null) {
  if (!scheduledAt) {
    return "Sin horario"
  }

  const date = new Date(scheduledAt)
  const hours24 = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const period = hours24 >= 12 ? "PM" : "AM"
  const hours12 = hours24 % 12 || 12
  return `${String(hours12).padStart(2, "0")}:${minutes} ${period}`
}

function getMatchPeriod(scheduledAt: string | null): "AM" | "PM" {
  if (!scheduledAt) {
    return "AM"
  }

  return new Date(scheduledAt).getHours() >= 12 ? "PM" : "AM"
}

function to24HourTime(hour: string, minute: string, period: "AM" | "PM") {
  const normalizedHour = Number(hour)
  const normalizedMinute = Number(minute)

  if (
    Number.isNaN(normalizedHour) ||
    Number.isNaN(normalizedMinute) ||
    normalizedHour < 1 ||
    normalizedHour > 12 ||
    normalizedMinute < 0 ||
    normalizedMinute > 59
  ) {
    return null
  }

  const isPm = period === "PM"
  const hour24 =
    normalizedHour === 12 ? (isPm ? 12 : 0) : isPm ? normalizedHour + 12 : normalizedHour

  return `${String(hour24).padStart(2, "0")}:${String(normalizedMinute).padStart(2, "0")}`
}

function getMatchSortTimestamp(scheduledAt: string | null) {
  return scheduledAt ? new Date(scheduledAt).getTime() : Number.POSITIVE_INFINITY
}

function sortMatchesBySchedule<T extends { scheduledAt: string | null; slot: number }>(matches: T[]) {
  return matches.slice().sort((a, b) => {
    const timeDiff = getMatchSortTimestamp(a.scheduledAt) - getMatchSortTimestamp(b.scheduledAt)

    if (timeDiff !== 0) {
      return timeDiff
    }

    return a.slot - b.slot
  })
}

function createMatchDraft(match: FixtureMatch): MatchDraft {
  const date = match.scheduledAt ? new Date(match.scheduledAt) : null
  const hour = date ? String(date.getHours() % 12 || 12).padStart(2, "0") : "12"
  const minute = date ? String(date.getMinutes()).padStart(2, "0") : "00"

  return {
    hour,
    minute,
    period: getMatchPeriod(match.scheduledAt),
    teamOneScore: String(match.teamOneScore ?? 0),
    teamTwoScore: String(match.teamTwoScore ?? 0),
  }
}

export function FixtureList({ tournamentId, initialFechas, teamCount }: FixtureListProps) {
  const [fechas, setFechas] = useState(initialFechas)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [highlightedFechaId, setHighlightedFechaId] = useState<string | null>(null)
  const [highlightedMatchId, setHighlightedMatchId] = useState<string | null>(null)
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null)
  const [matchDrafts, setMatchDrafts] = useState<Record<string, MatchDraft>>({})
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null)
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fechaHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maximumFechaCount = teamCount % 2 === 0 ? teamCount - 1 : teamCount
  const canGenerateFecha = teamCount >= 2 && fechas.length < maximumFechaCount

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }

      if (fechaHighlightTimeoutRef.current) {
        clearTimeout(fechaHighlightTimeoutRef.current)
      }
    }
  }, [])

  function flashMovedMatch(matchId: string) {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current)
    }

    setHighlightedMatchId(matchId)
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedMatchId(null)
      highlightTimeoutRef.current = null
    }, 1500)
  }

  function flashCreatedFecha(fechaId: string) {
    if (fechaHighlightTimeoutRef.current) {
      clearTimeout(fechaHighlightTimeoutRef.current)
    }

    setHighlightedFechaId(fechaId)
    fechaHighlightTimeoutRef.current = setTimeout(() => {
      setHighlightedFechaId(null)
      fechaHighlightTimeoutRef.current = null
    }, 1500)
  }

  function getFechaForMatch(matchId: string) {
    return fechas.find((fecha) => fecha.matches.some((match) => match.id === matchId))
  }

  async function saveMatchDraft(matchId: string) {
    const fecha = getFechaForMatch(matchId)
    if (!fecha) {
      return
    }

    const match = fecha.matches.find((item) => item.id === matchId)
    if (!match) {
      return
    }

    const draft = matchDrafts[matchId] ?? createMatchDraft(match)
    const scheduledAt = to24HourTime(draft.hour, draft.minute, draft.period)

    if (!scheduledAt) {
      setError("Ingresá una hora válida.")
      return
    }

    setSavingMatchId(matchId)
    setError(null)

    const response = await updateMatchDetails(matchId, {
      scheduledAt,
      teamOneScore: draft.teamOneScore,
      teamTwoScore: draft.teamTwoScore,
    })

    setSavingMatchId(null)

    if (response?.error) {
      setError(response.error)
      return
    }

    if (response?.fecha) {
      setFechas((current) =>
        current.map((item) => (item.id === response.fecha.id ? response.fecha : item))
      )
      setEditingMatchId(null)
      setHighlightedMatchId(matchId)
      flashMovedMatch(matchId)
      setMatchDrafts((current) => {
        const nextDrafts = { ...current }
        delete nextDrafts[matchId]
        return nextDrafts
      })
    }
  }

  async function handleMatchCardClick(matchId: string) {
    if (savingMatchId) {
      return
    }

    const fecha = getFechaForMatch(matchId)
    if (fecha?.status === "CLOSED") {
      return
    }

    if (editingMatchId === matchId) {
      await saveMatchDraft(matchId)
      return
    }

    if (editingMatchId && editingMatchId !== matchId) {
      await saveMatchDraft(editingMatchId)
      return
    }

    const match = fecha?.matches.find((item) => item.id === matchId)
    if (!match) {
      return
    }

    setMatchDrafts((current) =>
      current[matchId] ? current : { ...current, [matchId]: createMatchDraft(match) }
    )
    setEditingMatchId(matchId)
  }

  async function handleGenerateFecha() {
    setError(null)
    setIsGenerating(true)

    const result = await generateFecha(tournamentId)

    setIsGenerating(false)

    if (result?.error) {
      if ("requiresClose" in result && result.requiresClose) {
        window.alert(result.error)
      } else {
        setError(result.error)
      }
      return
    }

    if (result?.fecha) {
      setFechas((current) => [...current, result.fecha])
      flashCreatedFecha(result.fecha.id)
    }
  }

  async function handleMatchStatusToggle(matchId: string) {
    const response = await toggleMatchStatus(matchId)

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
              ? { ...match, status: response.match.status }
              : match
          ),
        }))
      )
    }
  }

  async function handleFechaDateChange(fechaId: string, date: string) {
    const response = await updateFechaDate(fechaId, date)

    if (response?.error) {
      setError(response.error)
      return
    }

    if (response?.fecha) {
      setFechas((current) =>
        current.map((fecha) => (fecha.id === fechaId ? response.fecha : fecha))
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

  async function handleDeleteMatch(matchId: string) {
    const confirmed = window.confirm(
      "¿Seguro que querés eliminar este partido? Los equipos pasarán al listado de descanso de esta fecha."
    )

    if (!confirmed) {
      return
    }

    setError(null)

    const response = await deleteMatch(matchId)

    if (response?.error) {
      setError(response.error)
      return
    }

    if (response?.fecha) {
      setFechas((current) =>
        current.map((fecha) => (fecha.id === response.fecha.id ? response.fecha : fecha))
      )

      if (editingMatchId === matchId) {
        setEditingMatchId(null)
      }

      setMatchDrafts((current) => {
        const nextDrafts = { ...current }
        delete nextDrafts[matchId]
        return nextDrafts
      })
    }
  }

  async function handleCloseFecha(fechaId: string) {
    const fecha = fechas.find((item) => item.id === fechaId)

    if (!fecha?.date) {
      window.alert("Seleccioná un día para la fecha antes de cerrarla.")
      return
    }

    const confirmed = window.confirm(
      "¿Seguro que querés cerrar esta fecha? La fecha será de solo lectura y se guardarán los datos registrados hasta este momento."
    )

    if (!confirmed) {
      return
    }

    const response = await closeFecha(fechaId)

    if (response?.error) {
      setError(response.error)
      return
    }

    setFechas((current) =>
      current.map((fecha) =>
        fecha.id === fechaId ? { ...fecha, status: "CLOSED" as const } : fecha
      )
    )
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Fixture</h2>
        </div>

        {canGenerateFecha ? (
          <Button type="button" onClick={handleGenerateFecha} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              "Generar fecha"
            )}
          </Button>
        ) : null}
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
              <div
                key={fecha.id}
                className={`rounded-xl border bg-muted/20 p-4 transition-all duration-500 ${
                  highlightedFechaId === fecha.id
                    ? "border-amber-400 bg-amber-400/15 shadow-[0_0_0_2px_rgba(251,191,36,0.45),0_0_24px_rgba(251,191,36,0.25)]"
                    : ""
                }`}
              >
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
                    {fecha.status === "CLOSED" ? (
                      <p className="mt-1 text-xs text-foreground">{formatClosedFechaDate(fecha.date)}</p>
                    ) : (
                      <input
                        type="date"
                        value={fecha.date ?? ""}
                        onChange={(event) => handleFechaDateChange(fecha.id, event.target.value)}
                        className="mt-1 w-full rounded-md border bg-background px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {sortMatchesBySchedule(fecha.matches).map((match) => {
                    const isEditing = editingMatchId === match.id
                    const draft = matchDrafts[match.id] ?? createMatchDraft(match)

                    return (
                      <div
                        key={match.id}
                        onClick={() => {
                          void handleMatchCardClick(match.id)
                        }}
                        className={`flex flex-col gap-3 rounded-lg border p-3 transition-all duration-500 ${
                          isEditing
                            ? "cursor-pointer border-emerald-500/60 bg-emerald-500/15"
                            : "cursor-pointer bg-background"
                        } ${
                          highlightedMatchId === match.id
                            ? "border-amber-400 bg-amber-400/15 shadow-[0_0_0_2px_rgba(251,191,36,0.45),0_0_24px_rgba(251,191,36,0.25)]"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 border-b pb-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Clock3 className="h-3.5 w-3.5" />
                            Horario
                          </span>
                          {fecha.status === "CLOSED" ? (
                            <span className="font-medium text-foreground">
                              {formatMatchTime(match.scheduledAt)}
                            </span>
                          ) : isEditing ? (
                            <div
                              className="flex items-center gap-2"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <input
                                type="number"
                                min={1}
                                max={12}
                                value={draft.hour}
                                onChange={(event) =>
                                  setMatchDrafts((current) => ({
                                    ...current,
                                    [match.id]: {
                                      ...draft,
                                      hour: event.target.value,
                                    },
                                  }))
                                }
                                className="h-8 w-14 rounded-md border bg-background px-2 text-center text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={`Hora del partido entre ${match.teamOne.name} y ${match.teamTwo.name}`}
                              />
                              <span className="text-xs text-muted-foreground">:</span>
                              <input
                                type="number"
                                min={0}
                                max={59}
                                value={draft.minute}
                                onChange={(event) =>
                                  setMatchDrafts((current) => ({
                                    ...current,
                                    [match.id]: {
                                      ...draft,
                                      minute: event.target.value,
                                    },
                                  }))
                                }
                                className="h-8 w-14 rounded-md border bg-background px-2 text-center text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={`Minutos del partido entre ${match.teamOne.name} y ${match.teamTwo.name}`}
                              />
                              <select
                                value={draft.period}
                                onChange={(event) =>
                                  setMatchDrafts((current) => ({
                                    ...current,
                                    [match.id]: {
                                      ...draft,
                                      period: event.target.value as "AM" | "PM",
                                    },
                                  }))
                                }
                                className="h-8 rounded-md border bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={`Periodo del partido entre ${match.teamOne.name} y ${match.teamTwo.name}`}
                              >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                              </select>
                            </div>
                          ) : (
                            <span className="font-medium text-foreground">
                              {formatMatchTime(match.scheduledAt)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 flex-1 text-left text-sm font-medium text-foreground">
                            {formatTeamName(match.teamOne.name)}
                          </span>

                          {fecha.status === "CLOSED" ? (
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              <span>{match.teamOneScore ?? 0}</span>
                              <span className="text-muted-foreground">:</span>
                              <span>{match.teamTwoScore ?? 0}</span>
                            </div>
                          ) : isEditing ? (
                            <div
                              className="flex items-center gap-2"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <input
                                type="number"
                                min={0}
                                value={draft.teamOneScore}
                                onChange={(event) =>
                                  setMatchDrafts((current) => ({
                                    ...current,
                                    [match.id]: {
                                      ...draft,
                                      teamOneScore: event.target.value,
                                    },
                                  }))
                                }
                                className="h-9 w-12 rounded-md border bg-background px-1 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="0"
                              />
                              <span className="text-muted-foreground">:</span>
                              <input
                                type="number"
                                min={0}
                                value={draft.teamTwoScore}
                                onChange={(event) =>
                                  setMatchDrafts((current) => ({
                                    ...current,
                                    [match.id]: {
                                      ...draft,
                                      teamTwoScore: event.target.value,
                                    },
                                  }))
                                }
                                className="h-9 w-12 rounded-md border bg-background px-1 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="0"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                              <span>{match.teamOneScore ?? 0}</span>
                              <span>:</span>
                              <span>{match.teamTwoScore ?? 0}</span>
                            </div>
                          )}

                          <span className="min-w-0 flex-1 text-right text-sm font-medium text-foreground">
                            {formatTeamName(match.teamTwo.name)}
                          </span>
                        </div>

                        {fecha.status !== "CLOSED" ? (
                          <div className="flex items-center justify-end border-t pt-3">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  className="cursor-pointer"
                                  disabled={savingMatchId === match.id}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    void saveMatchDraft(match.id)
                                  }}
                                >
                                  {savingMatchId === match.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Guardando...
                                    </>
                                  ) : (
                                    "Guardar y cerrar"
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="cursor-pointer gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  disabled={savingMatchId === match.id}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    void handleDeleteMatch(match.id)
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Eliminar partido
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  Click en la tarjeta para editar hora y goles
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="cursor-pointer gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  disabled={savingMatchId === match.id}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    void handleDeleteMatch(match.id)
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Eliminar partido
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                {(fecha.restingTeams ?? []).length > 0 ? (
                  <div className="mt-4 border-t pt-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Descansa esta fecha: </span>
                    {(fecha.restingTeams ?? []).map((team) => formatTeamName(team.name)).join(", ")}
                  </div>
                ) : null}

                {fecha.status !== "CLOSED" ? (
                  <div className="mt-4 flex gap-2 border-t pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleCloseFecha(fecha.id)}
                    >
                      <LockKeyhole className="h-3.5 w-3.5" />
                      Cerrar fecha
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDeleteFecha(fecha.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar fecha
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
