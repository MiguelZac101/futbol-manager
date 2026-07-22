import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CreateTournamentDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Crear torneo</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear torneo</DialogTitle>
          <DialogDescription>
            Completa los datos básicos para iniciar un nuevo torneo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" placeholder="Torneo de verano 2026" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Fecha de inicio</Label>
            <Input id="date" type="date" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slots">Cupo máximo</Label>
            <Input id="slots" type="number" placeholder="16" />
          </div>
        </div>

        <DialogFooter>
          <Button type="submit">Guardar torneo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}