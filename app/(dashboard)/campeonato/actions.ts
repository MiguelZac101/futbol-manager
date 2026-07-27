// app/(dashboard)/campeonato/actions.ts
"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { tournamentSchema } from "./components/schema"

export async function createTournament(formData: FormData) {
  const rawData = {
    name: formData.get("name"),
  }

  const parsed = tournamentSchema.safeParse(rawData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  await prisma.tournament.create({
    data: { name: parsed.data.name },
  })

  revalidatePath("/campeonato")
  return { success: true }
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