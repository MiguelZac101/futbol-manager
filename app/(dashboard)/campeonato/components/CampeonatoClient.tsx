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

interface Option {
  id: string
  name: string
}

interface CampeonatoClientProps {
  tournaments: Tournament[]
  venues: Option[]
  referees: Option[]
}

export function CampeonatoClient({ tournaments: initialTournaments, venues, referees }: CampeonatoClientProps) {
  const [open, setOpen] = useState(false)
  const [tournaments, setTournaments] = useState(initialTournaments)

  function handleTournamentCreated(nextTournament: Tournament) {
    setTournaments((current) => [nextTournament, ...current])
  }

  return (
    <>
      <h1 className="text-2xl mb-6">Campeonatos</h1>

      <TournamentList 
        tournaments={tournaments} 
        onCreate={() => setOpen(true)} 
        />

      <CreateTournamentDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={handleTournamentCreated}
        venues={venues}
        referees={referees}
      />
    </>
  )
}