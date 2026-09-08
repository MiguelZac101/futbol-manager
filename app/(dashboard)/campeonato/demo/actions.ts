"use server"

import { getDemoContext, resetDemoWorkspace } from "@/lib/demo-workspace"

export async function resetMyDemo() {
  const { workspace } = await resetDemoWorkspace()

  if (!workspace.sandboxTournamentId) {
    throw new Error("No se pudo crear el nuevo espacio demo.")
  }

  return { sandboxTournamentId: workspace.sandboxTournamentId }
}

export async function prepareMyDemo() {
  const { workspace } = await getDemoContext()

  if (!workspace.sandboxTournamentId) {
    throw new Error("No se pudo preparar el espacio demo.")
  }

  return { sandboxTournamentId: workspace.sandboxTournamentId }
}
