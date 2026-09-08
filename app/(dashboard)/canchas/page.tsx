import { prisma } from "@/lib/prisma"
import { VenueList } from "./components/VenueList"
import { auth, currentUser } from "@clerk/nextjs/server"

async function ensureLocalUser() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("No hay usuario autenticado")
  }

  const clerkUser = await currentUser()

  if (!clerkUser) {
    throw new Error("No se pudo obtener el usuario de Clerk")
  }

  const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress ?? ""
  const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "Usuario"

  let localUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!localUser) {
    localUser = await prisma.user.create({
      data: {
        clerkId: userId,
        name: fullName,
        email: primaryEmail || `${userId}@local.clerk`,
        imageUrl: clerkUser.imageUrl || null,
      },
    })
  }

  return localUser
}

export default async function CanchasPage() {
  const localUser = await ensureLocalUser()
  const venues = await prisma.venue.findMany({
    where: { ownerId: localUser.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      imageUrl: true,
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Canchas</h1>
        <p className="text-sm text-muted-foreground">
          Administrá las canchas reutilizables de tu cuenta.
        </p>
      </div>

      <VenueList initialVenues={venues} />
    </div>
  )
}
