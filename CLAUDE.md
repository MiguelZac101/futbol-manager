# CLAUDE.md

Contexto del proyecto para asistentes de IA (Claude Code y compatibles). Léelo antes de sugerir cambios de arquitectura o comandos.

## Antes que nada: verificar versiones, no asumirlas

Buena parte de los problemas de configuración de este proyecto (Prisma especialmente)
vinieron de asumir comportamiento de una versión distinta a la real — ya sea por
memoria/entrenamiento desactualizado, o por tutoriales/docs genéricas que hablaban
de una versión anterior.

**Regla**: antes de sugerir código o comandos relacionados a cualquier dependencia
con versionado mayor (Prisma, Next.js, React, etc.), leer la versión real en
`package.json` (y si aplica, correr `[herramienta] -v` o el comando de info de esa
librería) en vez de asumir comportamiento de versiones anteriores. Esto es
especialmente crítico con Prisma, que cambió su arquitectura de configuración
entre v6 y v7 (ver sección de Prisma más abajo) — un cambio de versión mayor puede
invalidar por completo un patrón que funcionaba antes.

Si una sugerencia contradice lo que ya está funcionando en este proyecto, asumir
que el código actual del proyecto es la fuente de verdad, no la memoria genérica
de "cómo funciona [librería] normalmente".

## Dominio del negocio: cómo funciona un "campeonato relámpago de barrio"

Esta sección describe las reglas de negocio reales del producto — no son suposiciones,
fueron definidas explícitamente por el dueño del producto. Antes de implementar
features nuevas relacionadas a torneos, equipos, fechas o partidos, leer esto primero.

### Entidades y quién las posee

- **User**: espejo local del usuario de Clerk. Cualquier usuario logueado puede crear
  campeonatos (no hay rol especial de "admin del sistema" — es admin de sus propios
  campeonatos).
- **Tournament**: pertenece a un `User` (organizador). Un usuario puede crear muchos.
- **Venue (cancha) y Referee (árbitro)**: pertenecen al `User` (organizador), NO al
  torneo. Son reutilizables entre varios campeonatos del mismo organizador — al crear/
  editar un torneo, se eligen de una lista ya registrada (combo/select), no se vuelven
  a registrar cada vez.
- **Team (equipo)**: pertenece a un `Tournament` específico (no se reutiliza entre
  torneos). Tiene nombre e imagen (logo/insignia).
- **Player (jugador)**: pertenece a un `Team`. Tiene nombre, DNI y foto.
- **Fecha (jornada)**: pertenece a un `Tournament`. Agrupa varios `Match`.
- **Match (partido)**: es un enfrentamiento único entre 2 equipos — **no hay distinción
  de local/visitante**, es "relámpago de barrio", no liga con visitas.

### Flujo del fixture — esto es lo más importante de entender bien

1. El organizador registra equipos (y sus jugadores) en el torneo.
2. Con un botón "Generar Fecha", el sistema arma los partidos de esa fecha.
3. **Fecha 1**: los rivales se sortean **aleatoriamente** entre todos los equipos
   (no hay ningún criterio, es puro azar).
4. **Fecha 2 en adelante**: los rivales TAMBIÉN se sortean aleatoriamente (esto no
   cambia nunca) — lo que sí cambia es el **orden en que se juegan** los partidos
   ya sorteados.
5. **El orden (quién juega primero) se determina por la tabla de posiciones**:
   el equipo 1ero de la tabla juega el partido en el `slot` 1 (más temprano), el
   2do en el `slot` 2, y así sucesivamente.
6. **La tabla de posiciones se ordena por**: puntos obtenidos (siempre, esto es fijo,
   no configurable) → en caso de empate en puntos, por el criterio de desempate del
   torneo (`Tournament.tiebreakerCriteria`, default = goles a favor). No se guarda
   como tabla propia en la base de datos — se calcula on-the-fly a partir de los
   `Match` con `status: COMPLETED`.
7. **Reprogramación manual**: el organizador puede intercambiar el horario/orden
   (`slot`) de dos partidos ya generados manualmente (ej. un equipo no puede jugar
   a esa hora específica). Esto es un intercambio entre partidos existentes de la
   misma fecha, no una reprogramación libre a cualquier fecha. `Match.wasSwapped`
   marca que ese partido fue movido manualmente, para poder distinguirlo en la UI.

### Errores de interpretación a evitar (ya se cometieron una vez, no repetir)

- ❌ NO asumir que el emparejamiento (quién juega contra quién) cambia según la tabla
  — el emparejamiento SIEMPRE es aleatorio, en todas las fechas.
- ❌ NO asumir "local/visitante" — no existe esa distinción en este proyecto.
- ❌ NO asumir que Venue/Referee pertenecen al Tournament — pertenecen al User
  (organizador), son reutilizables entre torneos.
- ❌ NO asumir que la tabla de posiciones se guarda en una tabla propia — se calcula
  siempre a partir de los partidos completados.

## Stack

- **Framework**: Next.js (App Router, Turbopack)
- **UI**: React + TypeScript + Tailwind + shadcn/ui
  - Theme: preset de terceros (`radix-nova`, no el estilo `default`/`new-york` estándar)
  - Algunos componentes de shadcn NO existen en el registro de este preset (ej. `form`). Si `pnpm dlx shadcn@latest add [componente]` se queda pegado en "Checking registry" sin traer nada, el componente no existe en ese preset — copiar el código manual desde ui.shadcn.com en vez de perder tiempo debugueando flags.
- **Auth**: Clerk (`useUser`, `useClerk`, `<UserButton />`)
- **Base de datos**: PostgreSQL en Neon
- **ORM**: Prisma **major 7** (verificar versión exacta en `package.json`, no asumir), generador `prisma-client` (NO `prisma-client-js`, es el generador nuevo con reglas distintas — confirmar cuál está en `schema.prisma` antes de sugerir código)
- **Forms**: React Hook Form + Zod (`@hookform/resolvers/zod`)
- **Notificaciones**: sonner
- **Gestor de paquetes**: **pnpm únicamente**. No mezclar con npm/npx.
  - Equivalente de `npx` → `pnpm dlx`
  - Ejecutar binario ya instalado → `pnpm exec`

## Prisma 7 — puntos clave (no aplican las guías genéricas de Prisma 6)

Todo lo de abajo es específico de Prisma **major 7**. Si en algún momento se
actualiza a Prisma 8+, volver a verificar cada uno de estos puntos contra el
changelog oficial antes de asumir que siguen aplicando igual.

- El `datasource` en `schema.prisma` **no lleva `url`** directamente si se usa `prisma.config.ts` (que sí lleva el `url`).
- El cliente generado vive donde diga `output` en `generator client` (actualmente `../lib/generated/prisma`), **no** en `@prisma/client`. Importar como:
  ```ts
  import { PrismaClient } from "./generated/prisma/client" // desde lib/prisma.ts
  ```
- Requiere un **adapter** explícito para conectar (`@prisma/adapter-pg` + `pg` en este proyecto). `lib/prisma.ts` ya está configurado así — no reescribir sin adapter.
- `prisma.config.ts` no carga `.env` automáticamente — necesita `import "dotenv/config"` al inicio.
- **Una sola `DATABASE_URL` (pooled, con `-pooler`) es suficiente.** No se necesita `DIRECT_URL` en este proyecto — se probó explícitamente y funciona sin ella.
- Un solo archivo `.env` (no usar `.env.local` en paralelo — causó bugs de configuración duplicada).

## UploadThing — configuración y gotchas

- Se usa para subir imágenes de `Team` (logo/insignia) desde el modal de creación.
- La variable de entorno requerida es `UPLOADTHING_TOKEN` en `.env`.
- El endpoint está en `app/api/uploadthing/route.ts` y expone un router llamado `teamImage`.
- El cliente usa un `UploadButton` generado desde `@uploadthing/react` y debe apuntar a `/api/uploadthing`.
- La respuesta del upload devuelve la URL final y luego se persiste en `Team.imageUrl`.
- El patrón correcto es: `onClientUploadComplete` -> guardar la URL localmente -> salvar con `createTeam`.
- Si el upload queda cargando eternamente, revisar primero:
  - que la variable `UPLOADTHING_TOKEN` existe en el entorno real;
  - que el middleware de Clerk no está bloqueando `/api/uploadthing`;
  - que no haya una segunda instancia de Next.js corriendo sobre el mismo puerto.
- En este proyecto, `proxy.ts` debe excluir `"/api/uploadthing(.*)"` del matcher protegido, porque el middleware de Clerk protege todo `/api` por default.
- No usar `.env.local` en paralelo con `.env`. La configuración del proyecto ya tuvo bugs por duplicar archivo de entorno.

## Patrones de arquitectura ya establecidos

### Rutas
- `app/(public)/` — rutas sin autenticación
- `app/(dashboard)/` — rutas protegidas, con su propio `layout.tsx` (Sidebar). Protegidas vía `middleware.ts` con Clerk.
- No usar prefijo `admin/*` — este dashboard es para cualquier usuario logueado, no solo administradores.

### Mutaciones de datos: Server Actions, no API Routes
- Cada sección tiene su `actions.ts` (ej. `app/(dashboard)/campeonato/actions.ts`)
- Server Actions se usan solo para **mutaciones** (create/update/delete)
- **Siempre validar con Zod también en la Server Action**, reusando el mismo schema del formulario (la validación del cliente es solo UX, no seguridad)

### Lectura de listas: estado local en el cliente, NO `revalidatePath`
Importante — esto se decidió después de debuggear un bug real:
- `revalidatePath` + cierre de modal causaba una condición de carrera visible (el modal parpadeaba: cerraba, reabría con dato viejo, cerraba de nuevo).
- **Patrón actual**: la Server Action devuelve el registro creado/actualizado (`{ success: true, tournament }`), y el componente padre actualiza el estado local (`useState`) directamente con ese dato. El modal se cierra en el mismo instante que se actualiza la lista — sin esperar ningún refetch del servidor.
- Aplicar el mismo patrón a `update` y `delete` cuando se implementen.

### Formularios en modales (Dialog)
- Usar `<Dialog>` de shadcn, controlado (`open`/`onOpenChange` con `useState` en el padre), no `DialogTrigger` — porque el botón que abre el modal vive en un componente distinto al modal.
- El form usa React Hook Form (`formState.isSubmitting` para el estado de carga del botón — no usar `useTransition` para esto, no se refleja a tiempo).
- Resetear el form con `useEffect` cuando `open` pasa a `true` (no al cerrar) — evita que quede el error/dato de la vez anterior visible al reabrir.

## Cosas ya resueltas — no repetir el debug

- El `.env` original tenía la URL de prueba local que genera `prisma init` por defecto (`prisma+postgres://localhost:...`) — causaba error P1001. Ya reemplazada por la URL real de Neon.
- `ThemeToggle` usa `useSyncExternalStore` (no `useState` + `useLayoutEffect`) para evitar el warning de React sobre `setState` síncrono en efectos, relacionado al patrón de mounted-check para SSR/hydration de temas.
- Advertencia de `sslmode=require` en la conexión pg: cosmética por ahora (aliasing a `verify-full` hasta la próxima major de `pg`), se puede silenciar cambiando a `sslmode=verify-full` explícito en la URL.