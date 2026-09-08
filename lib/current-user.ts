import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function ensureLocalUser() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("No hay usuario autenticado")
  }

  const clerkUser = await currentUser()

  if (!clerkUser) {
    throw new Error("No se pudo obtener el usuario de Clerk")
  }

  const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress ?? ""
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "Usuario"

  return prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: {
      clerkId: userId,
      name,
      email: primaryEmail || `${userId}@local.clerk`,
      imageUrl: clerkUser.imageUrl || null,
    },
  })
}
