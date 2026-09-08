"use server"

import { resetDemoWorkspace } from "@/lib/demo-workspace"

export async function resetMyDemo() {
  const { workspace } = await resetDemoWorkspace()

  if (!workspace.sandboxTournamentId) {
    throw new Error("No se pudo crear el nuevo espacio demo.")
  }

  return { sandboxTournamentId: workspace.sandboxTournamentId }
}
