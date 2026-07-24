// app/(dashboard)/campeonato/actions.ts
"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createTournament(formData: FormData) {
  const name = formData.get("name") as string

  if (!name || name.trim().length === 0) {
    return { error: "El nombre es requerido" }
  }

  await prisma.tournament.create({
    data: { name: name.trim() },
  })

  revalidatePath("/campeonato")
  return { success: true }
}