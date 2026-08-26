"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const venueSchema = z.object({
  name: z.string().trim().min(2, "El nombre de la cancha debe tener al menos 2 caracteres"),
  address: z.string().trim().min(5, "La dirección es obligatoria"),
  imageUrl: z.string().url("La imagen debe ser una URL válida").nullable().optional(),
  latitude: z.string().trim().optional(),
  longitude: z.string().trim().optional(),
})

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

function parseCoordinate(
  value: string | null | undefined,
  fieldLabel: string,
  min: number,
  max: number
) {
  if (!value || !value.trim()) {
    return { value: null as number | null }
  }

  const parsed = Number(value)

  if (Number.isNaN(parsed)) {
    return { error: `${fieldLabel} debe ser un número válido.` }
  }

  if (parsed < min || parsed > max) {
    return { error: `${fieldLabel} debe estar entre ${min} y ${max}.` }
  }

  return { value: parsed }
}

function buildVenueSelect() {
  return {
    id: true,
    name: true,
    address: true,
    latitude: true,
    longitude: true,
    imageUrl: true,
  } as const
}

export async function createVenue(formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    address: formData.get("address"),
    imageUrl: formData.get("imageUrl"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
  }

  const parsed = venueSchema.safeParse(rawData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const latitude = parseCoordinate(parsed.data.latitude, "La latitud", -90, 90)
  if ("error" in latitude) {
    return { error: latitude.error }
  }

  const longitude = parseCoordinate(parsed.data.longitude, "La longitud", -180, 180)
  if ("error" in longitude) {
    return { error: longitude.error }
  }

  if ((latitude.value === null) !== (longitude.value === null)) {
    return { error: "Ingresá latitud y longitud juntas o dejalas vacías." }
  }

  const owner = await ensureLocalUser()

  const venue = await prisma.venue.create({
    data: {
      name: parsed.data.name,
      address: parsed.data.address,
      imageUrl: parsed.data.imageUrl ?? null,
      latitude: latitude.value,
      longitude: longitude.value,
      ownerId: owner.id,
    },
    select: buildVenueSelect(),
  })

  return { success: true, venue }
}

export async function updateVenue(venueId: string, formData: FormData) {
  if (!venueId) {
    return { error: "ID de cancha inválido" }
  }

  const rawData = {
    name: formData.get("name"),
    address: formData.get("address"),
    imageUrl: formData.get("imageUrl"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
  }

  const parsed = venueSchema.safeParse(rawData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const latitude = parseCoordinate(parsed.data.latitude, "La latitud", -90, 90)
  if ("error" in latitude) {
    return { error: latitude.error }
  }

  const longitude = parseCoordinate(parsed.data.longitude, "La longitud", -180, 180)
  if ("error" in longitude) {
    return { error: longitude.error }
  }

  if ((latitude.value === null) !== (longitude.value === null)) {
    return { error: "Ingresá latitud y longitud juntas o dejalas vacías." }
  }

  const owner = await ensureLocalUser()
  const currentVenue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { ownerId: true },
  })

  if (!currentVenue) {
    return { error: "La cancha no existe." }
  }

  if (currentVenue.ownerId !== owner.id) {
    return { error: "No tenés permiso para editar esta cancha." }
  }

  const venue = await prisma.venue.update({
    where: { id: venueId },
    data: {
      name: parsed.data.name,
      address: parsed.data.address,
      imageUrl: parsed.data.imageUrl ?? null,
      latitude: latitude.value,
      longitude: longitude.value,
    },
    select: buildVenueSelect(),
  })

  return { success: true, venue }
}

export async function deleteVenue(venueId: string) {
  if (!venueId) {
    return { error: "ID de cancha inválido" }
  }

  const owner = await ensureLocalUser()
  const currentVenue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { ownerId: true },
  })

  if (!currentVenue) {
    return { error: "La cancha no existe." }
  }

  if (currentVenue.ownerId !== owner.id) {
    return { error: "No tenés permiso para eliminar esta cancha." }
  }

  const assignedMatches = await prisma.match.count({
    where: { venueId },
  })

  if (assignedMatches > 0) {
    return { error: "No podés eliminar esta cancha porque está asignada a partidos." }
  }

  await prisma.venue.delete({
    where: { id: venueId },
  })

  return { success: true }
}
