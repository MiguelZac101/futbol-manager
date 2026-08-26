"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const refereeSchema = z.object({
  name: z.string().trim().min(2, "El nombre del árbitro debe tener al menos 2 caracteres"),
  dni: z.string().trim().min(2, "El DNI es obligatorio"),
  imageUrl: z.string().url("La imagen debe ser una URL válida").nullable().optional(),
})

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

export async function createReferee(formData: FormData) {
  const rawData = {
    name: formData.get("name"),
    dni: formData.get("dni"),
    imageUrl: formData.get("imageUrl"),
  }

  const parsed = refereeSchema.safeParse(rawData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const owner = await ensureLocalUser()

  const referee = await prisma.referee.create({
    data: {
      name: parsed.data.name,
      dni: parsed.data.dni,
      imageUrl: parsed.data.imageUrl ?? null,
      ownerId: owner.id,
    },
    select: {
      id: true,
      name: true,
      dni: true,
      imageUrl: true,
    },
  })

  return { success: true, referee }
}

export async function updateReferee(refereeId: string, formData: FormData) {
  if (!refereeId) {
    return { error: "ID de árbitro inválido" }
  }

  const rawData = {
    name: formData.get("name"),
    dni: formData.get("dni"),
    imageUrl: formData.get("imageUrl"),
  }

  const parsed = refereeSchema.safeParse(rawData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const owner = await ensureLocalUser()
  const currentReferee = await prisma.referee.findUnique({
    where: { id: refereeId },
    select: { ownerId: true },
  })

  if (!currentReferee) {
    return { error: "El árbitro no existe." }
  }

  if (currentReferee.ownerId !== owner.id) {
    return { error: "No tenés permiso para editar este árbitro." }
  }

  const referee = await prisma.referee.update({
    where: { id: refereeId },
    data: {
      name: parsed.data.name,
      dni: parsed.data.dni,
      imageUrl: parsed.data.imageUrl ?? null,
    },
    select: {
      id: true,
      name: true,
      dni: true,
      imageUrl: true,
    },
  })

  return { success: true, referee }
}

export async function deleteReferee(refereeId: string) {
  if (!refereeId) {
    return { error: "ID de árbitro inválido" }
  }

  const owner = await ensureLocalUser()
  const currentReferee = await prisma.referee.findUnique({
    where: { id: refereeId },
    select: { ownerId: true },
  })

  if (!currentReferee) {
    return { error: "El árbitro no existe." }
  }

  if (currentReferee.ownerId !== owner.id) {
    return { error: "No tenés permiso para eliminar este árbitro." }
  }

  const assignedMatches = await prisma.match.count({
    where: { refereeId },
  })

  if (assignedMatches > 0) {
    return { error: "No podés eliminar este árbitro porque está asignado a partidos." }
  }

  await prisma.referee.delete({
    where: { id: refereeId },
  })

  return { success: true }
}
