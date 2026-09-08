"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FlaskConical, RotateCcw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { resetMyDemo } from "../../demo/actions"

interface DemoSandboxNoticeProps {
  expiresAt: Date
}

export function DemoSandboxNotice({ expiresAt }: DemoSandboxNoticeProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReset() {
    setIsResetting(true)
    setError(null)

    try {
      const result = await resetMyDemo()
      setOpen(false)
      router.replace(`/campeonato/${result.sandboxTournamentId}`)
      router.refresh()
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "No se pudo restablecer la demo.")
      setIsResetting(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium">Estás editando una demo privada</p>
            <p className="text-sm text-muted-foreground">
              Tus cambios no afectan a otros usuarios y se eliminarán el{" "}
              {expiresAt.toLocaleString("es-AR")}.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          Restablecer demo
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Restablecer tu demo?</DialogTitle>
            <DialogDescription>
              Se eliminarán todos tus cambios y volverás al estado inicial de la plantilla.
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isResetting}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReset}
              disabled={isResetting}
              className="cursor-pointer"
            >
              {isResetting ? "Restableciendo..." : "Restablecer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
