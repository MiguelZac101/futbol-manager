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
import { reopenFecha, type FixtureDate } from "../actions"

interface FechaConfigurationProps {
  fechas: FixtureDate[]
}

export function FechaConfiguration({ fechas }: FechaConfigurationProps) {
  const router = useRouter()
  const [selectedFechaId, setSelectedFechaId] = useState("")
  const [isReopening, setIsReopening] = useState(false)
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