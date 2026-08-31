// app/(dashboard)/campeonato/actions.ts
"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { tournamentSchema } from "./components/schema"

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

export async function getOrganizerVenues() {
  const owner = await ensureLocalUser()

  return prisma.venue.findMany({
    where: { ownerId: owner.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })
}

export async function getOrganizerReferees() {
  const owner = await ensureLocalUser()

  return prisma.referee.findMany({
    where: { ownerId: owner.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })
}

export async function createTournament(formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    defaultVenueId: formData.get("defaultVenueId") || undefined,
    defaultRefereeId: formData.get("defaultRefereeId") || undefined,
  }

  const parsed = tournamentSchema.safeParse(rawData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const organizer = await ensureLocalUser()

  const tournament = await prisma.tournament.create({
    data: {
      name: parsed.data.name,
      organizerId: organizer.id,
      defaultVenueId: parsed.data.defaultVenueId || null,
      defaultRefereeId: parsed.data.defaultRefereeId || null,
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  })

  return { success: true, tournament }
}

export async function deleteTournament(id: string) {
  if (!id) {
    return { error: "ID de campeonato inválido" }
  }

  await prisma.tournament.delete({
    where: { id },
  })

  revalidatePath("/campeonato")
  return { success: true }
}