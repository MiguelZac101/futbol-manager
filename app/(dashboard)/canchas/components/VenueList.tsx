"use client"

import Image from "next/image"
import { useState } from "react"
import { ExternalLink, Loader2, Pencil, Plus, Trash2, MapPinned } from "lucide-react"
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
import { createVenue, deleteVenue, updateVenue } from "../actions"

interface Venue {
  id: string
  name: string
  address: string
  latitude?: number | null
  longitude?: number | null
  imageUrl?: string | null
}

interface VenueListProps {
  initialVenues: Venue[]
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
}

function buildGoogleMapsUrl(venue: { address: string; latitude?: number | null; longitude?: number | null }) {
  if (venue.latitude !== null && venue.latitude !== undefined && venue.longitude !== null && venue.longitude !== undefined) {
    return `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`
}

export function VenueList({ initialVenues }: VenueListProps) {
  const [venues, setVenues] = useState(initialVenues)
  const [openFormDialog, setOpenFormDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null)
  const [deletingVenueId, setDeletingVenueId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  function resetForm() {
    setEditingVenueId(null)
    setName("")
    setAddress("")
    setLatitude("")
    setLongitude("")
    setImageUrl(null)
    setError(null)
  }

  function openCreateDialog() {
    resetForm()
    setOpenFormDialog(true)
  }

  function openEditDialog(venue: Venue) {
    setEditingVenueId(venue.id)
    setName(venue.name)
    setAddress(venue.address)
    setLatitude(venue.latitude !== null && venue.latitude !== undefined ? String(venue.latitude) : "")
    setLongitude(venue.longitude !== null && venue.longitude !== undefined ? String(venue.longitude) : "")
    setImageUrl(venue.imageUrl ?? null)
    setError(null)
    setOpenFormDialog(true)
  }

  function openConfirmDeleteDialog(venue: Venue) {
    setDeletingVenueId(venue.id)
    setError(null)
    setOpenDeleteDialog(true)
  }

  function closeFormDialog() {
    setOpenFormDialog(false)
    resetForm()
  }

  function closeDeleteDialog() {
    setOpenDeleteDialog(false)
    setDeletingVenueId(null)
    setError(null)
    setIsDeleting(false)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Ingresá el nombre de la cancha")
      return
    }

    if (!address.trim()) {
      setError("Ingresá la dirección de la cancha")
      return
    }

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("name", name.trim())
    formData.append("address", address.trim())
    formData.append("latitude", latitude.trim())
    formData.append("longitude", longitude.trim())

    if (imageUrl) {
      formData.append("imageUrl", imageUrl)
    }

    const result = editingVenueId ? await updateVenue(editingVenueId, formData) : await createVenue(formData)

    if (result?.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    if (result?.venue) {
      setVenues((current) =>
        editingVenueId
          ? current.map((item) => (item.id === result.venue.id ? result.venue : item))
          : [result.venue, ...current]
      )
    }

    setIsSubmitting(false)
    closeFormDialog()
  }

  async function handleDelete() {
    if (!deletingVenueId) {
      return
    }

    setIsDeleting(true)
    setError(null)

    const result = await deleteVenue(deletingVenueId)

    if (result?.error) {
      setError(result.error)
      setIsDeleting(false)
      return
    }

    setVenues((current) => current.filter((venue) => venue.id !== deletingVenueId))
    closeDeleteDialog()
  }

  return (
    <>
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <MapPinned className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Canchas</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <button
            type="button"
            onClick={openCreateDialog}
            title="Crear nueva cancha"
            className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 p-6 transition-colors hover:border-muted-foreground/50 hover:bg-muted/40 cursor-pointer"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Cancha</span>
          </button>

          {venues.map((venue) => (
            <div
              key={venue.id}
              className="flex min-h-52 flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 transition-all duration-200 ease-out hover:border-primary/50 hover:bg-accent/20 hover:shadow-sm"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                {venue.imageUrl ? (
                  <div className="relative h-16 w-16 overflow-hidden rounded-full bg-transparent">
                    <Image
                      src={venue.imageUrl}
                      alt={venue.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 bg-muted/40 text-lg font-bold uppercase text-muted-foreground">
                    {getInitials(venue.name)}
                  </div>
                )}

                <div className="space-y-1">
                  <span className="block text-sm font-medium text-foreground">
                    {venue.name.replace(/\b\w/g, (char) => char.toUpperCase())}
                  </span>
                  <span className="block text-xs text-muted-foreground">{venue.address}</span>
                  {venue.latitude !== null && venue.latitude !== undefined && venue.longitude !== null && venue.longitude !== undefined ? (
                    <span className="block text-xs text-muted-foreground">
                      {venue.latitude}, {venue.longitude}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <a
                  href={buildGoogleMapsUrl(venue)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-7 items-center justify-center gap-2 rounded-md border border-input bg-background px-2.5 text-sm font-medium hover:bg-muted"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver en Google Maps
                </a>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 cursor-pointer gap-2"
                    onClick={() => openEditDialog(venue)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="flex-1 cursor-pointer gap-2"
                    onClick={() => openConfirmDeleteDialog(venue)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {venues.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Todavía no hay canchas cargadas.
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
            <DialogTitle>{editingVenueId ? "Editar cancha" : "Agregar cancha"}</DialogTitle>
            <DialogDescription>
              {editingVenueId
                ? "Actualiza el nombre, la imagen y la ubicación."
                : "Carga una cancha para reutilizarla en tus partidos."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="venue-name" className="text-sm font-medium">
                Nombre de la cancha
              </label>
              <Input
                id="venue-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Cancha del barrio"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="venue-address" className="text-sm font-medium">
                Dirección
              </label>
              <Input
                id="venue-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Av. Siempre Viva 742"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="venue-latitude" className="text-sm font-medium">
                  Latitud
                </label>
                <Input
                  id="venue-latitude"
                  value={latitude}
                  onChange={(event) => setLatitude(event.target.value)}
                  placeholder="-34.6037"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="venue-longitude" className="text-sm font-medium">
                  Longitud
                </label>
                <Input
                  id="venue-longitude"
                  value={longitude}
                  onChange={(event) => setLongitude(event.target.value)}
                  placeholder="-58.3816"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Podés abrir Google Maps, elegir el punto y copiar las coordenadas aquí.
            </p>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir Google Maps
            </a>

            <div className="space-y-2">
              <label className="text-sm font-medium">Imagen de la cancha</label>

              <UploadButton
                endpoint="venueImage"
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
                    alt="Imagen de la cancha"
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
                  "Guardar cancha"
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
              ¿Estás seguro que deseas eliminar la cancha{" "}
              <span className="font-semibold text-foreground">
                {venues.find((venue) => venue.id === deletingVenueId)?.name ?? "seleccionada"}
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
