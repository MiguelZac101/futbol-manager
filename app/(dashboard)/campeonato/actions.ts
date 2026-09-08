// app/(dashboard)/campeonato/actions.ts
"use server"

import { prisma } from "@/lib/prisma"
import { ensureLocalUser } from "@/lib/current-user"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { tournamentSchema } from "./components/schema"
import { slugify } from "@/lib/slug"
import { authorizeTournamentMutation, syncDemoImageAsset } from "@/lib/demo-workspace"

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

async function generateUniqueSlug(name: string) {
  const base = slugify(name) || "campeonato"
  let candidate = base
  let suffix = 1

  while (await prisma.tournament.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    suffix += 1
    candidate = `${base}-${suffix}`
  }

  return candidate
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
  const slug = await generateUniqueSlug(parsed.data.name)

  const tournament = await prisma.tournament.create({
    data: {
      name: parsed.data.name,
      slug,
      organizerId: organizer.id,
      defaultVenueId: parsed.data.defaultVenueId || null,
      defaultRefereeId: parsed.data.defaultRefereeId || null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
    },
  })

  return { success: true, tournament }
}

export async function deleteTournament(id: string) {
  if (!id) {
    return { error: "ID de campeonato inválido" }
  }

  await authorizeTournamentMutation(id)
  await prisma.tournament.delete({
    where: { id },
  })

  revalidatePath("/campeonato")
  return { success: true }
}

export async function updateTournament(id: string, formData: FormData) {
  if (!id) {
    return { error: "ID de campeonato inválido" }
  }

  const rawData = {
    name: formData.get("name"),
    imageUrl: formData.get("imageUrl") || null,
    defaultVenueId: formData.get("defaultVenueId") || undefined,
    defaultRefereeId: formData.get("defaultRefereeId") || undefined,
  }

  const parsed = tournamentSchema
    .extend({
      imageUrl: z.string().url("La imagen debe ser una URL válida").nullable().optional(),
    })
    .safeParse(rawData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  await authorizeTournamentMutation(id)

  const previous = await prisma.tournament.findUnique({
    where: { id },
    select: { imageUrl: true },
  })

  if (!previous) {
    return { error: "El campeonato no existe" }
  }

  const tournament = await prisma.tournament.update({
    where: { id },
    data: {
      name: parsed.data.name,
      imageUrl: parsed.data.imageUrl ?? null,
      defaultVenueId: parsed.data.defaultVenueId || null,
      defaultRefereeId: parsed.data.defaultRefereeId || null,
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      defaultVenueId: true,
      defaultRefereeId: true,
    },
  })

  await syncDemoImageAsset(id, previous.imageUrl, tournament.imageUrl)

  revalidatePath("/campeonato")
  revalidatePath(`/campeonato/${id}`)

  return { success: true, tournament }
}