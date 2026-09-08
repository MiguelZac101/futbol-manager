import { NextResponse } from "next/server"
import { cleanupExpiredDemoWorkspaces } from "@/lib/demo-workspace"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authorization = request.headers.get("authorization")

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const result = await cleanupExpiredDemoWorkspaces()

  return NextResponse.json({
    success: true,
    ...result,
  })
}
