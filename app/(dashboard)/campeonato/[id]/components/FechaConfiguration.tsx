"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { reopenFecha, updateFixtureSettings, type FixtureDate } from "../actions"

const DEFAULT_FIXTURE_START_TIME = "10:00"
const DEFAULT_MATCH_INTERVAL_MINUTES = 40

interface FechaConfigurationProps {
  tournamentId: string
  fechas: FixtureDate[]
  initialFixtureStartTime: string
  initialMatchIntervalMinutes: number
}

export function FechaConfiguration({
  tournamentId,
  fechas,
  initialFixtureStartTime,
  initialMatchIntervalMinutes,
}: FechaConfigurationProps) {
  const router = useRouter()
  const [selectedFechaId, setSelectedFechaId] = useState("")
  const [fixtureStartTime, setFixtureStartTime] = useState(
    initialFixtureStartTime || DEFAULT_FIXTURE_START_TIME
  )
  const [matchIntervalMinutes, setMatchIntervalMinutes] = useState(
    String(initialMatchIntervalMinutes || DEFAULT_MATCH_INTERVAL_MINUTES)
  )
  const [isReopening, setIsReopening] = useState(false)
  const [isSavingFixtureSettings, setIsSavingFixtureSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const closedFechas = fechas.filter((fecha) => fecha.status === "CLOSED")

  async function handleReopenFecha() {
    if (!selectedFechaId) {
      window.alert("Seleccioná una fecha cerrada para reabrirla.")
      return
    }

    const fecha = fechas.find((item) => item.id === selectedFechaId)
    const confirmed = window.confirm(
      `¿Seguro que querés reabrir la fecha ${fecha?.number ?? "seleccionada"}? Volverá a ser editable.`
    )

    if (!confirmed) {
      return
    }

    setIsReopening(true)
    setError(null)
    const response = await reopenFecha(selectedFechaId)
    setIsReopening(false)

    if (response?.error) {
      setError(response.error)
      return
    }

    setSelectedFechaId("")
    router.refresh()
  }

  async function handleSaveFixtureSettings() {
    setIsSavingFixtureSettings(true)
    setError(null)
    const response = await updateFixtureSettings(tournamentId, {
      fixtureStartTime,
      matchIntervalMinutes: Number(matchIntervalMinutes),
    })
    setIsSavingFixtureSettings(false)

    if (response?.error) {
      setError(response.error)
      return
    }

    router.refresh()
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Configuración</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Fixture</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="fixture-start-time">
                Hora de inicio de la fecha
              </label>
              <input
                id="fixture-start-time"
                type="time"
                value={fixtureStartTime}
                onChange={(event) => setFixtureStartTime(event.target.value)}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="match-interval-minutes">
                Intervalo entre partidos (minutos)
              </label>
              <input
                id="match-interval-minutes"
                type="number"
                min={1}
                step={1}
                value={matchIntervalMinutes}
                onChange={(event) => setMatchIntervalMinutes(event.target.value)}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full cursor-pointer"
            onClick={handleSaveFixtureSettings}
            disabled={isSavingFixtureSettings}
          >
            {isSavingFixtureSettings ? "Guardando..." : "Guardar horarios"}
          </Button>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="reopen-fecha">
              Reabrir fecha cerrada
            </label>
            <Select value={selectedFechaId} onValueChange={setSelectedFechaId}>
              <SelectTrigger id="reopen-fecha" className="w-full">
                <SelectValue placeholder="Seleccioná una fecha" />
              </SelectTrigger>
              <SelectContent>
                {closedFechas.map((fecha) => (
                  <SelectItem key={fecha.id} value={fecha.id}>
                    Fecha {fecha.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {closedFechas.length === 0 ? (
              <p className="text-xs text-muted-foreground">No hay fechas cerradas para reabrir.</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full cursor-pointer"
            onClick={handleReopenFecha}
            disabled={isReopening || closedFechas.length === 0}
          >
            {isReopening ? "Reabriendo..." : "Reabrir fecha"}
          </Button>
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  )
}