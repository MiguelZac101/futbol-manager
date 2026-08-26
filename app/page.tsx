import Link from "next/link"
import { ArrowRight, CalendarDays, MapPinned, ShieldHalf, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    title: "Campeonatos",
    description: "Gestioná torneos, fixture, fechas, resultados y tabla de posiciones.",
    icon: CalendarDays,
  },
  {
    title: "Equipos y jugadores",
    description: "Cargá equipos, planteles e imágenes para ordenar todo en un solo lugar.",
    icon: Users,
  },
  {
    title: "Árbitros y canchas",
    description: "Reutilizá árbitros y canchas entre torneos del mismo organizador.",
    icon: ShieldHalf,
  },
  {
    title: "Ubicaciones",
    description: "Guardá dirección y coordenadas para abrir rápidamente el punto en Maps.",
    icon: MapPinned,
  },
]

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Futbol Manager
            </p>
            <p className="text-sm text-muted-foreground">
              Gestión simple para campeonatos de barrio
            </p>
          </div>

          <Button asChild>
            <Link href="/sign-in" className="gap-2">
              Login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center gap-6">
            <div className="space-y-4">
              <span className="inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                Todo lo que necesitás para organizar un campeonato
              </span>
              <h1 className="max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
                Administrá fixture, equipos, árbitros y canchas en un solo sistema.
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                Futbol Manager te ayuda a organizar campeonatos relámpago con generación de
                fechas, descansos, resultados, árbitros reutilizables y canchas con ubicación.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/sign-in" className="gap-2">
                  Iniciar sesión
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/sign-up">Crear cuenta</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon

              return (
                <div key={feature.title} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold">{feature.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <p>Futbol Manager · Gestión de campeonatos relámpago de barrio</p>
          <p>Fixture, resultados, descansos, árbitros y canchas en un solo lugar.</p>
        </div>
      </footer>
    </div>
  )
}
