import Link from "next/link"
import { FlaskConical } from "lucide-react"
import { getOrCreateDemoWorkspace } from "@/lib/demo-workspace"
import { Button } from "@/components/ui/button"

export default async function DemoTournamentPage() {
  const { workspace, templateTournament, isNewOrExpired } = await getOrCreateDemoWorkspace()

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <FlaskConical className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Campeonato demo</p>
        <h1 className="text-3xl font-bold tracking-tight">{templateTournament.name}</h1>
        <p className="text-muted-foreground">
          {isNewOrExpired
            ? "Tu espacio de prueba privado está listo."
            : "Reanudaste tu espacio de prueba privado."}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Se conservará hasta el {workspace.expiresAt.toLocaleString("es-AR")}.
      </p>
      <Button asChild>
        <Link href="/campeonato">Volver a campeonatos</Link>
      </Button>
    </div>
  )
}
