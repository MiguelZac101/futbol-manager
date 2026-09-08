"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { FlaskConical, Loader2 } from "lucide-react"
import { prepareMyDemo } from "./actions"

export default function DemoTournamentPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    prepareMyDemo()
      .then(({ sandboxTournamentId }) => {
        router.replace(`/campeonato/${sandboxTournamentId}`)
      })
      .catch(() => {
        setError("No se pudo preparar tu espacio de prueba. Intenta nuevamente.")
      })
  }, [router])

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        {error ? (
          <FlaskConical className="h-8 w-8 text-primary" />
        ) : (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        )}
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Campeonato demo</p>
        <h1 className="text-3xl font-bold tracking-tight">
          {error ? "Algo salió mal" : "Preparando tu espacio de prueba…"}
        </h1>
        <p className="text-muted-foreground">
          {error ?? "Estamos clonando el campeonato de demostración para tu cuenta. Esto puede tardar unos segundos."}
        </p>
      </div>
    </div>
  )
}
