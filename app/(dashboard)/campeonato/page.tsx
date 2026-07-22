import { TournamentList } from "./components/TournamentList";

// app/(dashboard)/campeonato/page.tsx
export default function CampeonatoPage() {
  return (
    <>      
      <h1 className="text-2xl mb-6">Campeonatos</h1>      

      <TournamentList
        tournaments={[
          { id: "1", name: "Torneo de verano 2026" },
          { id: "2", name: "Copa Chess Club" },
        ]}

      />
    </>
  )

}
