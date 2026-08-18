"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { UploadButton } from "@/lib/uploadthing"
import { deleteTeam, updateTeam } from "../../../actions"

interface TeamActionsProps {
  team: {
    id: string
    name: string
    imageUrl?: string | null
  }
  tournamentId: string
}

export function TeamActions({ team, tournamentId }: TeamActionsProps) {
  const router = useRouter()
  const [currentName, setCurrentName] = useState(team.name)
  const [currentImageUrl, setCurrentImageUrl] = useState(team.imageUrl ?? null)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [name, setName] = useState(team.name)
  const [imageUrl, setImageUrl] = useState<string | null>(team.imageUrl ?? null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  function resetForm() {
    setName(currentName)
    setImageUrl(currentImageUrl)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Ingresá el nombre del equipo")
      return
    }

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("name", name.trim())

    if (imageUrl) {
      formData.append("imageUrl", imageUrl)
    }

    const result = await updateTeam(team.id, formData)

    if (result?.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    if (result?.team) {
      setCurrentName(result.team.name)
      setCurrentImageUrl(result.team.imageUrl ?? null)
    }

    setOpenEditDialog(false)
    setIsSubmitting(false)
    resetForm()
  }

  async function confirmDelete() {
    setIsDeleting(true)

    const result = await deleteTeam(team.id)

    if (result?.error) {
      setError(result.error)
      setIsDeleting(false)
      setOpenDeleteDialog(false)
      return
    }

    router.push(`/campeonato/${tournamentId}`)
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            resetForm()
            setOpenEditDialog(true)
          }}
          className="flex h-auto min-w-24 cursor-pointer flex-col items-center gap-2 px-3 py-3 text-xs"
        >
          <Pencil className="h-7 w-7" />
          <span>Editar</span>
        </Button>

        <Button
          type="button"
          variant="destructive"
          onClick={() => setOpenDeleteDialog(true)}
          className="flex h-auto min-w-24 cursor-pointer flex-col items-center gap-2 px-3 py-3 text-xs"
        >
          <Trash2 className="h-7 w-7" />
          <span>Eliminar</span>
        </Button>
      </div>

      <Dialog
        open={openEditDialog}
        onOpenChange={(nextOpen) => {
          setOpenEditDialog(nextOpen)
          if (!nextOpen) {
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar equipo</DialogTitle>
            <DialogDescription>
              Actualiza el nombre y la imagen del equipo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="team-name" className="text-sm font-medium">
                Nombre del equipo
              </label>
              <Input
                id="team-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Logo del equipo</label>

              <UploadButton
                endpoint="teamImage"
                onClientUploadComplete={(res) => {
                  const uploadedUrl = res?.[0]?.url
                  if (uploadedUrl) {
                    setImageUrl(uploadedUrl)
                  }
                }}
                onUploadError={(error: Error) => {
                  setError(error.message)
                }}
                className="ut-button:bg-primary ut-button:text-primary-foreground ut-button:hover:bg-primary/90"
              />

              {imageUrl ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-md bg-muted/20">
                  <Image
                    src={imageUrl}
                    alt="Logo del equipo"
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ) : null}
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenEditDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas eliminar al equipo <span className="font-semibold text-foreground">{currentName}</span>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
