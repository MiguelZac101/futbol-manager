"use client"

import Image from "next/image"
import { useState } from "react"
import { Loader2, Pencil, Plus, Trash2, Users } from "lucide-react"
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
import { createReferee, deleteReferee, updateReferee } from "../actions"

interface Referee {
  id: string
  name: string
  dni: string
  imageUrl?: string | null
}

interface RefereeListProps {
  initialReferees: Referee[]
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
}

export function RefereeList({ initialReferees }: RefereeListProps) {
  const [referees, setReferees] = useState(initialReferees)
  const [openFormDialog, setOpenFormDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [editingRefereeId, setEditingRefereeId] = useState<string | null>(null)
  const [deletingRefereeId, setDeletingRefereeId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [dni, setDni] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  function resetForm() {
    setEditingRefereeId(null)
    setName("")
    setDni("")
    setImageUrl(null)
    setError(null)
  }

  function openCreateDialog() {
    resetForm()
    setOpenFormDialog(true)
  }

  function openEditDialog(referee: Referee) {
    setEditingRefereeId(referee.id)
    setName(referee.name)
    setDni(referee.dni)
    setImageUrl(referee.imageUrl ?? null)
    setError(null)
    setOpenFormDialog(true)
  }

  function openConfirmDeleteDialog(referee: Referee) {
    setDeletingRefereeId(referee.id)
    setError(null)
    setOpenDeleteDialog(true)
  }

  function closeFormDialog() {
    setOpenFormDialog(false)
    resetForm()
  }

  function closeDeleteDialog() {
    setOpenDeleteDialog(false)
    setDeletingRefereeId(null)
    setError(null)
    setIsDeleting(false)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Ingresá el nombre del árbitro")
      return
    }

    if (!dni.trim()) {
      setError("Ingresá el DNI del árbitro")
      return
    }

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("name", name.trim())
    formData.append("dni", dni.trim())

    if (imageUrl) {
      formData.append("imageUrl", imageUrl)
    }

    const result = editingRefereeId
      ? await updateReferee(editingRefereeId, formData)
      : await createReferee(formData)

    if (result?.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    if (result?.referee) {
      setReferees((current) =>
        editingRefereeId
          ? current.map((item) => (item.id === result.referee.id ? result.referee : item))
          : [result.referee, ...current]
      )
    }

    setIsSubmitting(false)
    closeFormDialog()
  }

  async function handleDelete() {
    if (!deletingRefereeId) {
      return
    }

    setIsDeleting(true)
    setError(null)

    const result = await deleteReferee(deletingRefereeId)

    if (result?.error) {
      setError(result.error)
      setIsDeleting(false)
      return
    }

    setReferees((current) => current.filter((referee) => referee.id !== deletingRefereeId))
    closeDeleteDialog()
  }

  return (
    <>
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Árbitros</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <button
            type="button"
            onClick={openCreateDialog}
            title="Crear nuevo árbitro"
            className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 p-6 transition-colors hover:border-muted-foreground/50 hover:bg-muted/40 cursor-pointer"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Árbitro</span>
          </button>

          {referees.map((referee) => (
            <div
              key={referee.id}
              className="flex min-h-44 flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 transition-all duration-200 ease-out hover:border-primary/50 hover:bg-accent/20 hover:shadow-sm"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                {referee.imageUrl ? (
                  <div className="relative h-16 w-16 overflow-hidden rounded-full bg-transparent">
                    <Image
                      src={referee.imageUrl}
                      alt={referee.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 bg-muted/40 text-lg font-bold uppercase text-muted-foreground">
                    {getInitials(referee.name)}
                  </div>
                )}

                <div className="space-y-1">
                  <span className="block text-sm font-medium text-foreground">
                    {referee.name.replace(/\b\w/g, (char) => char.toUpperCase())}
                  </span>
                  <span className="block text-xs text-muted-foreground">DNI {referee.dni}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 cursor-pointer gap-2"
                  onClick={() => openEditDialog(referee)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="flex-1 cursor-pointer gap-2"
                  onClick={() => openConfirmDeleteDialog(referee)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>

        {referees.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Todavía no hay árbitros cargados.
          </div>
        ) : null}
      </div>

      <Dialog
        open={openFormDialog}
        onOpenChange={(nextOpen) => {
          setOpenFormDialog(nextOpen)
          if (!nextOpen) {
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRefereeId ? "Editar árbitro" : "Agregar árbitro"}</DialogTitle>
            <DialogDescription>
              {editingRefereeId
                ? "Actualiza los datos y la foto del árbitro."
                : "Carga un árbitro para reutilizarlo en los partidos."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="referee-name" className="text-sm font-medium">
                Nombre del árbitro
              </label>
              <Input
                id="referee-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="referee-dni" className="text-sm font-medium">
                DNI
              </label>
              <Input
                id="referee-dni"
                value={dni}
                onChange={(event) => setDni(event.target.value)}
                placeholder="12345678"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Foto del árbitro</label>

              <UploadButton
                endpoint="refereeImage"
                onClientUploadComplete={(res) => {
                  const uploadedUrl = res?.[0]?.url
                  if (uploadedUrl) {
                    setImageUrl(uploadedUrl)
                  }
                }}
                onUploadError={(uploadError: Error) => {
                  setError(uploadError.message)
                }}
                className="ut-button:bg-primary ut-button:text-primary-foreground ut-button:hover:bg-primary/90"
              />

              {imageUrl ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-md bg-muted/20">
                  <Image
                    src={imageUrl}
                    alt="Foto del árbitro"
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ) : null}
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeFormDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar árbitro"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openDeleteDialog} onOpenChange={(nextOpen) => (nextOpen ? setOpenDeleteDialog(true) : closeDeleteDialog())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas eliminar al árbitro{" "}
              <span className="font-semibold text-foreground">
                {referees.find((referee) => referee.id === deletingRefereeId)?.name ?? "seleccionado"}
              </span>
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDeleteDialog}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
