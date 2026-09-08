import { prisma } from "@/lib/prisma"
import { ensureLocalUser } from "./actions"
import { RefereeList } from "./components/RefereeList"

export default async function ArbitrosPage() {
  const localUser = await ensureLocalUser()
  const referees = await prisma.referee.findMany({
    where: { ownerId: localUser.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      dni: true,
      imageUrl: true,
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Árbitros</h1>
        <p className="text-sm text-muted-foreground">
          Administrá los árbitros reutilizables de tu cuenta.
        </p>
      </div>

      <RefereeList initialReferees={referees} />
    </div>
  )
}
