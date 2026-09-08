import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../lib/generated/prisma/client"

const DEMO_KEY = "main"
const DEMO_ORGANIZER_CLERK_ID = "system_demo_organizer"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL es obligatoria para ejecutar la semilla.")
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

async function main() {
  const organizer = await prisma.user.upsert({
    where: { clerkId: DEMO_ORGANIZER_CLERK_ID },
    update: {},
    create: {
      clerkId: DEMO_ORGANIZER_CLERK_ID,
      name: "Organizador Demo",
      email: "demo-organizer@futbol-manager.local",
    },
  })

  const tournament = await prisma.tournament.upsert({
    where: { demoKey: DEMO_KEY },
    update: {},
    create: {
      name: "Copa Demo Barrio",
      slug: "copa-demo-barrio",
      demoKey: DEMO_KEY,
      organizerId: organizer.id,
      teams: {
        create: [
          {
            name: "Los Pumas",
            players: {
              create: [
                { name: "Mateo Rojas", dni: "40000001" },
                { name: "Bruno Diaz", dni: "40000002" },
              ],
            },
          },
          {
            name: "Deportivo Norte",
            players: {
              create: [
                { name: "Lucas Fernandez", dni: "40000003" },
                { name: "Tomas Acosta", dni: "40000004" },
              ],
            },
          },
          {
            name: "Estrella Roja",
            players: {
              create: [
                { name: "Nicolas Gomez", dni: "40000005" },
                { name: "Franco Silva", dni: "40000006" },
              ],
            },
          },
          {
            name: "Union del Sur",
            players: {
              create: [
                { name: "Martin Torres", dni: "40000007" },
                { name: "Santiago Vera", dni: "40000008" },
              ],
            },
          },
        ],
      },
    },
  })

  const [teams, fechaCount] = await Promise.all([
    prisma.team.findMany({
      where: { tournamentId: tournament.id },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
    prisma.fecha.count({
      where: { tournamentId: tournament.id },
    }),
  ])

  if (fechaCount === 0 && teams.length === 4) {
    await prisma.fecha.create({
      data: {
        number: 1,
        generationMethod: "RANDOM",
        tournamentId: tournament.id,
        matches: {
          create: [
            { slot: 1, teamOneId: teams[0].id, teamTwoId: teams[1].id },
            { slot: 2, teamOneId: teams[2].id, teamTwoId: teams[3].id },
          ],
        },
      },
    })
  }

  console.info(`Campeonato demo "${DEMO_KEY}" listo.`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
