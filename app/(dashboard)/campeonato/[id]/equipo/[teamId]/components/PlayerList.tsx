"use client"

import Image from "next/image"
import { useState } from "react"
import { Pencil, Plus, Trash2, UserRound } from "lucide-react"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { UploadButton } from "@/lib/uploadthing"
import { createPlayer, deletePlayer, updatePlayer } from "../actions"

interface Player {
  id: string
  name: string
  dni: string
  photoUrl?: string | null
}

interface PlayerListProps {
  teamId: string
  initialPlayers: Player[]
}

export function PlayerList({ teamId, initialPlayers }: PlayerListProps) {
  const [players, setPlayers] = useState(initialPlayers)
  const [open, setOpen] = useState(false)
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [dni, setDni] = useState("")
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null)

  function resetForm() {
    setName("")
    setDni("")
    setPhotoUrl(null)
    setEditingPlayerId(null)
    setError(null)
  }

  function openCreateDialog() {
    resetForm()
    setOpen(true)
  }

  function openEditDialog(player: Player) {
    setEditingPlayerId(player.id)
    setName(player.name)
    setDni(player.dni)
    setPhotoUrl(player.photoUrl ?? null)
    setError(null)
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Ingresá el nombre del jugador")
      return
    }

    if (!dni.trim()) {
      setError("Ingresá el DNI del jugador")
      return
    }

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("name", name.trim())
    formData.append("dni", dni.trim())

    if (photoUrl) {
      formData.append("photoUrl", photoUrl)
    }

    const result = editingPlayerId
      ? await updatePlayer(editingPlayerId, formData)
      : await createPlayer(teamId, formData)

    if (result?.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    if (result?.player) {
      setPlayers((current) => {
        if (editingPlayerId) {
          return current.map((player) => (player.id === result.player.id ? result.player : player))
        }

        return [result.player, ...current]
      })
    }

    resetForm()
    setOpen(false)
    setIsSubmitting(false)
  }

  function openDeleteConfirmDialog(player: Player) {
    setPlayerToDelete(player)
    setOpenDeleteConfirm(true)
  }

  async function confirmDelete() {
    if (!playerToDelete) return

    setDeletingId(playerToDelete.id)
    const result = await deletePlayer(playerToDelete.id)

    if (result?.success) {
      setPlayers((current) => current.filter((player) => player.id !== playerToDelete.id))
    }

    setDeletingId(null)
    setOpenDeleteConfirm(false)
    setPlayerToDelete(null)
  }

  return (
    <>
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Jugadores</h2>
          </div>
          <span className="text-sm text-muted-foreground">{players.length}</span>
        </div>

        <div className="grid gap-4 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5">
          <button
            type="button"
            onClick={openCreateDialog}
            title="Crear nuevo jugador"
            className="flex h-full min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 p-4 transition-colors hover:bg-muted/40 hover:border-muted-foreground/50 cursor-pointer"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground text-center">Jugador</span>
          </button>

          {players.map((player) => (
            <div
              key={player.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card transition-shadow hover:shadow-md"
            >
              <div className="relative h-64 w-full overflow-hidden bg-muted/20">
                {player.photoUrl ? (
                    <Image
                      src={player.photoUrl}
                      alt={player.name}
                      fill
                      sizes="(max-width: 768px) 150px, 200px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-bold uppercase text-muted-foreground bg-gradient-to-br from-muted to-muted/50">
                      {player.name.slice(0, 1)}
                    </div>
                  )}
              </div>

              <div className="flex flex-col gap-2 px-3 py-2">
                <div className="text-center">
                  <p className="text-sm font-semibold line-clamp-1">{player.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">DNI: {player.dni}</p>
                </div>
              </div>

              <div className="flex w-full gap-1 border-t px-2 py-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 flex-1 text-xs p-1 cursor-pointer"
                        onClick={() => openEditDialog(player)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 flex-1 text-xs text-destructive hover:text-destructive p-1 cursor-pointer"
                        onClick={() => openDeleteConfirmDialog(player)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Eliminar</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          ))}
        </div>

        {players.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Todavía no hay jugadores en este equipo.
          </div>
        ) : null}
      </div>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) {
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPlayerId ? "Editar jugador" : "Agregar jugador"}</DialogTitle>
            <DialogDescription>
              {editingPlayerId
                ? "Actualiza los datos del jugador y su foto."
                : "Carga la información del jugador para este equipo."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="player-name" className="text-sm font-medium">
                Nombre
              </label>
              <Input
                id="player-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Lionel Messi"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="player-dni" className="text-sm font-medium">
                DNI
              </label>
              <Input
                id="player-dni"
                value={dni}
                onChange={(event) => setDni(event.target.value)}
                placeholder="12345678"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Foto del jugador</label>

              <UploadButton
                endpoint="teamImage"
                onClientUploadComplete={(res: Array<{ url: string }>) => {
                  const uploadedUrl = res?.[0]?.url
                  if (uploadedUrl) {
                    setPhotoUrl(uploadedUrl)
                  }
                }}
                onUploadError={(error: Error) => {
                  setError(error.message)
                }}
                className="ut-button:bg-primary ut-button:text-primary-foreground ut-button:hover:bg-primary/90"
              />

              {photoUrl ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-md bg-muted/20">
                  <Image
                    src={photoUrl}
                    alt="Foto del jugador"
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ) : null}
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : editingPlayerId ? "Guardar cambios" : "Guardar jugador"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openDeleteConfirm} onOpenChange={setOpenDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas eliminar al jugador{" "}
              <span className="font-semibold text-foreground">{playerToDelete?.name}</span>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenDeleteConfirm(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deletingId === playerToDelete?.id}
            >
              {deletingId === playerToDelete?.id ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
