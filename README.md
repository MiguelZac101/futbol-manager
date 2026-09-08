# ⚽ Futbol Manager

Sistema de gestión para **campeonatos relámpago de barrio**: organización de torneos, equipos, jugadores, fixture, resultados y tabla de posiciones — con canchas y árbitros reutilizables entre torneos, y una página pública de resumen para compartir con el público.

## Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router, Turbopack)
- **UI**: React + TypeScript + Tailwind CSS + [shadcn/ui](https://ui.shadcn.com) (preset `radix-nova`)
- **Autenticación**: [Clerk](https://clerk.com)
- **Base de datos**: PostgreSQL en [Neon](https://neon.tech)
- **ORM**: [Prisma](https://www.prisma.io) 7 (generador `prisma-client` + adapter `@prisma/adapter-pg`)
- **Formularios**: React Hook Form + Zod
- **Subida de imágenes**: [UploadThing](https://uploadthing.com)
- **Notificaciones**: sonner
- **Gestor de paquetes**: pnpm

## Cómo funciona un campeonato relámpago de barrio

- Cualquier usuario logueado puede crear campeonatos (no hay rol de "admin del sistema").
- **Cancha** y **Árbitro** pertenecen al organizador (no al torneo) y se reutilizan entre varios campeonatos mediante un selector.
- **Equipo** pertenece a un torneo específico; **Jugador** pertenece a un equipo.
- Los partidos **no tienen distinción de local/visitante**.
- Al generar una **fecha** (jornada):
  - Los rivales se sortean **siempre al azar**, en todas las fechas.
  - El **orden en que se juega** cada partido (slot) se determina por la tabla de posiciones: el 1° de la tabla juega primero, y así sucesivamente.
  - La tabla de posiciones se calcula on-the-fly a partir de los partidos completados (no se almacena), ordenada por puntos y luego por el criterio de desempate configurado en el torneo (goles a favor por defecto).
  - El organizador puede intercambiar manualmente el horario/orden de dos partidos ya generados.

## Estructura de rutas

- `app/page.tsx` — landing pública, sin autenticación.
- `app/(auth)` — `sign-in` / `sign-up` con Clerk.
- `app/(dashboard)` — panel protegido (requiere sesión), con sidebar:
  - `/dashboard` — resumen general (conteo de campeonatos/canchas/árbitros y campeonatos recientes).
  - `/campeonato` — listado y creación de campeonatos.
  - `/campeonato/[id]` — detalle de un campeonato, con subsecciones: `configuracion`, `fixture`, `posiciones`, `equipos`, `equipo/[teamId]`.
  - `/arbitros` — gestión de árbitros del organizador.
  - `/canchas` — gestión de canchas del organizador.
- `app/t/[slug]` — página **pública** (sin autenticación) con el resumen de un campeonato: cancha/árbitro asignado, tabla de posiciones, equipos y próximos partidos. Cada campeonato genera un slug único y amigable a partir de su nombre.

## Requisitos previos

- Node.js 20+
- pnpm
- Una base de datos PostgreSQL (recomendado: [Neon](https://neon.tech))
- Cuenta de [Clerk](https://clerk.com) para autenticación
- Cuenta de [UploadThing](https://uploadthing.com) para subida de imágenes

## Variables de entorno

Crear un único archivo `.env` en la raíz (no usar `.env.local` en paralelo) con:

```bash
DATABASE_URL="postgresql://usuario:password@host/db?sslmode=require"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

UPLOADTHING_TOKEN="..."
CRON_SECRET="un-secreto-largo-y-aleatorio"
```

> Solo se necesita una `DATABASE_URL` (pooled, con `-pooler`); no se requiere `DIRECT_URL`.

`CRON_SECRET` protege la limpieza diaria de sandboxes demo. En Vercel, configurarlo
como variable de entorno de producción y asignar el mismo valor como secret del cron.

## Getting Started

Instalar dependencias:

```bash
pnpm install
```

Aplicar las migraciones de Prisma y generar el cliente:

```bash
pnpm exec prisma migrate deploy
pnpm exec prisma generate
```

Levantar el servidor de desarrollo:

```bash
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Scripts disponibles

```bash
pnpm dev      # servidor de desarrollo (Turbopack)
pnpm build    # build de producción
pnpm start    # servidor de producción
pnpm lint     # ESLint
```

## Prisma

El cliente generado vive en `lib/generated/prisma` (no en `@prisma/client`) y se importa desde `lib/prisma.ts`, que ya configura el adapter de Postgres (`@prisma/adapter-pg`). Para cambios de esquema:

```bash
pnpm exec prisma migrate dev --name nombre_del_cambio
```

## Despliegue

La forma más simple de desplegar es usando [Vercel](https://vercel.com/new). Ver la [documentación de despliegue de Next.js](https://nextjs.org/docs/app/building-your-application/deploying) para más detalles.

El archivo `vercel.json` programa `/api/cron/cleanup-demo` a las 03:00 UTC cada día.
El job elimina sandboxes demo vencidos y sus imágenes alojadas en UploadThing.
