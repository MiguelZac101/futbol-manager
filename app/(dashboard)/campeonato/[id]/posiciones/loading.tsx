import { Loader2 } from "lucide-react"

export default function TournamentPosicionesLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando tabla de posiciones…</p>
      </div>
    </div>
  )
}
