// app/(dashboard)/campeonato/components/CampeonatoClient.tsx
"use client"

import { useState } from "react"
import { TournamentList } from "./TournamentList"
import { CreateTournamentDialog } from "./CreateTournamentDialog"

interface Tournament {
  id: string
  name: string
  imageUrl?: string | null
}

export function CampeonatoClient({ tournaments }: { tournaments: Tournament[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <h1 className="text-2xl mb-6">Campeonatos</h1>

      <TournamentList tournaments={tournaments} onCreate={() => setOpen(true)} />

      <CreateTournamentDialog open={open} onOpenChange={setOpen} />
    </>
  )
}