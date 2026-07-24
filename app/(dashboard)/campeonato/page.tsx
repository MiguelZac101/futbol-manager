'use client'

import { useState } from "react";
import { TournamentList } from "./components/TournamentList";
import { CreateTournamentDialog } from "./components/CreateTournamentDialog";

// app/(dashboard)/campeonato/page.tsx
export default function CampeonatoPage() {

  const [open, setOpen] = useState(false);

  return (
    <>      
      <h1 className="text-2xl mb-6">Campeonatos</h1>      

      <TournamentList
        tournaments={[
          { id: "1", name: "Torneo de verano 2026" },
          { id: "2", name: "Copa Chess Club" },
        ]}

        onCreate={() => setOpen(true)}

      />

      <CreateTournamentDialog open={open} onOpenChange={setOpen} />

    </>
  )

}
