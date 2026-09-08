import { Loader2 } from "lucide-react"

export default function DemoTournamentLoading() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Campeonato demo</p>
        <h1 className="text-3xl font-bold tracking-tight">Preparando tu espacio de prueba…</h1>
        <p className="text-muted-foreground">
          Estamos clonando el campeonato de demostración para tu cuenta. Esto puede tardar unos segundos.
        </p>
      </div>
    </div>
  )
}
