"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Pencil, ChevronDownIcon } from "lucide-react"
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
import { updateTournament } from "../../actions"
import { PublicLink } from "./PublicLink"

interface Option {
  id: string
  name: string
}

interface TournamentActionsProps {
  tournament: {
    id: string
    name: string
    slug: string
    imageUrl?: string | null
    defaultVenueId?: string | null
    defaultRefereeId?: string | null
    isDemoSandbox?: boolean
  }
  venues: Option[]
  referees: Option[]
}

export function TournamentActions({ tournament, venues, referees }: TournamentActionsProps) {
  const router = useRouter()
  const [currentName, setCurrentName] = useState(tournament.name)
  const [currentImageUrl, setCurrentImageUrl] = useState(tournament.imageUrl ?? null)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [name, setName] = useState(tournament.name)
  const [imageUrl, setImageUrl] = useState<string | null>(tournament.imageUrl ?? null)
  const [defaultVenueId, setDefaultVenueId] = useState(tournament.defaultVenueId ?? "")
  const [defaultRefereeId, setDefaultRefereeId] = useState(tournament.defaultRefereeId ?? "")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function resetForm() {
    setName(currentName)
    setImageUrl(currentImageUrl)
    setDefaultVenueId(tournament.defaultVenueId ?? "")
    setDefaultRefereeId(tournament.defaultRefereeId ?? "")
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Ingresá el nombre del campeonato")
      return
    }

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("name", name.trim())

    if (imageUrl) {
      formData.append("imageUrl", imageUrl)
    }

    if (defaultVenueId) {
      formData.append("defaultVenueId", defaultVenueId)
    }

    if (defaultRefereeId) {
      formData.append("defaultRefereeId", defaultRefereeId)
    }

    const result = await updateTournament(tournament.id, formData)

    if (result?.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    if (result?.tournament) {
      setCurrentName(result.tournament.name)
      setCurrentImageUrl(result.tournament.imageUrl ?? null)
    }

    setOpenEditDialog(false)
    setIsSubmitting(false)
    resetForm()
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {!tournament.isDemoSandbox ? <PublicLink slug={tournament.slug} /> : null}
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
            <DialogTitle>Editar campeonato</DialogTitle>
            <DialogDescription>
              Actualiza el nombre y la imagen del campeonato.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="tournament-name" className="text-sm font-medium">
                Nombre del campeonato
              </label>
              <Input
                id="tournament-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="tournament-venue" className="text-sm font-medium">
                Cancha
              </label>
              <div className="relative">
                <select
                  id="tournament-venue"
                  value={defaultVenueId}
                  onChange={(event) => setDefaultVenueId(event.target.value)}
                  className="flex h-8 w-full appearance-none items-center rounded-lg border border-input bg-transparent py-2 pr-8 pl-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="">Selecciona una cancha (opcional)</option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="tournament-referee" className="text-sm font-medium">
                Árbitro
              </label>
              <div className="relative">
                <select
                  id="tournament-referee"
                  value={defaultRefereeId}
                  onChange={(event) => setDefaultRefereeId(event.target.value)}
                  className="flex h-8 w-full appearance-none items-center rounded-lg border border-input bg-transparent py-2 pr-8 pl-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="">Selecciona un árbitro (opcional)</option>
                  {referees.map((referee) => (
                    <option key={referee.id} value={referee.id}>
                      {referee.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Imagen del campeonato</label>

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
                    alt="Imagen del campeonato"
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
    </>
  )
}
