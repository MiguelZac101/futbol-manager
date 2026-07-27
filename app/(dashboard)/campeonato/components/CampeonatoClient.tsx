// app/(dashboard)/campeonato/components/CampeonatoClient.tsx
"use client"

import { useState } from "react"
import { TournamentList } from "./TournamentList"
import { CreateTournamentDialog } from "./CreateTournamentDialog"
import { deleteTournament } from "../actions"
import { toast } from "sonner"

interface Tournament {
  id: string
  name: string
  imageUrl?: string | null
}

export function CampeonatoClient({ tournaments }: { tournaments: Tournament[] }) {
  const [open, setOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)

    toast.promise(
      deleteTournament(id).finally(() => setDeletingId(null)),
      {
        loading: "Eliminando campeonato...",
        success: "Campeonato eliminado",
        error: "No se pudo eliminar el campeonato",
      }
    )
  }

  return (
    <>
      <h1 className="text-2xl mb-6">Campeonatos</h1>

      <TournamentList 
        tournaments={tournaments} 
        onCreate={() => setOpen(true)} 
        onDelete={handleDelete}
        deletingId={deletingId}
        />

      <CreateTournamentDialog open={open} onOpenChange={setOpen} />
    </>
  )
}