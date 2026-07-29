# Ciclos

Registro del ciclo menstrual junto a las fases lunares. Aplicación web instalable
(PWA), multiusuario y en español.

## Puesta en marcha

Hacen falta dos credenciales externas antes de que la app arranque.

### 1. Base de datos Postgres

Cualquier Postgres sirve. La vía más corta es crear una gratuita:

```bash
npx create-db
```

También funcionan [Neon](https://neon.tech), [Supabase](https://supabase.com) o
Vercel Postgres: solo cambia la cadena de conexión.

### 2. Claves de Clerk

Crea una aplicación en [dashboard.clerk.com](https://dashboard.clerk.com) y copia
sus dos claves de la sección **API Keys**.

### 3. Variables de entorno

```bash
cp .env.example .env
```

Rellena `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`.

### 4. Crear las tablas y arrancar

```bash
npx prisma migrate dev --name init
npm run dev
```

La app queda en <http://localhost:3000>.

## Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Compilación de producción |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Comprobación de tipos |
| `npx prisma studio` | Explorador visual de la base de datos |
| `npx prisma migrate dev` | Aplica cambios del schema |

Tras editar `prisma/schema.prisma` hay que regenerar el cliente con
`npx prisma generate` (`migrate dev` ya lo hace).

## Estructura

```
prisma/schema.prisma        Modelo de datos
prisma.config.ts            Configuración de Prisma 7
src/
  proxy.ts                  Contexto de sesión de Clerk (antes middleware.ts)
  generated/prisma/         Cliente Prisma generado — no se versiona
  lib/
    prisma.ts               Cliente con driver adapter de Postgres
    cycle.ts                Predicción del ciclo (adaptador sobre cyclia)
    moon.ts                 Fases lunares en español
    format.ts               Formateo de fechas
    dal/cycles.ts           Data Access Layer: todo acceso a datos pasa por aquí
  app/
    page.tsx                Landing pública
    manifest.ts             Manifiesto de la PWA
    sw.ts                   Service worker (Serwist)
    serwist/[path]/route.ts Compila y sirve el service worker
    (auth)/                 Entrar y registrarse
    (app)/hoy               Pantalla principal
    (app)/calendario        Calendario mensual con ciclo y luna
    (app)/registro          Historial y alta de periodos
  components/               Componentes compartidos
```

## Decisiones que conviene conocer

**Las fechas de ciclo son fechas civiles, sin hora.** Se guardan como `@db.Date`
y se manipulan siempre con accesores UTC (`src/lib/cycle.ts`). Sin esta
disciplina, un periodo anotado a las 23:00 se almacenaría como el día anterior.
Los formateadores de `src/lib/format.ts` fijan `timeZone: "UTC"` por el mismo
motivo.

**Toda consulta pasa por el DAL.** Los Server Functions son alcanzables por POST
directo, no solo desde la interfaz, así que ninguna función del DAL acepta un
`userId` desde fuera: lo toma de la sesión y lo incluye en el `where`. Las
operaciones de modificación usan `updateMany`/`deleteMany` en vez de
`update`/`delete` precisamente para que el `userId` entre en el filtro.

**La autenticación se comprueba junto al recurso, no por patrón de ruta.**
Clerk 7 desaconseja `createRouteMatcher` porque la coincidencia de rutas puede
divergir de cómo Next enruta las peticiones. `proxy.ts` solo establece el
contexto; quien decide es el layout de `(app)` y el DAL.

**La predicción viene de [`cyclia`](https://www.npmjs.com/package/cyclia)**
(estrategia de media móvil ponderada), envuelta en `src/lib/cycle.ts`. El
adaptador corrige dos comportamientos comprobados de la librería: devuelve
`1970-01-01` en lugar de `null` cuando no hay datos, y su `confidence` es tan
conservadora que se traduce a niveles cualitativos en vez de mostrarse como
porcentaje.

**La PWA usa Serwist, no `next-pwa`.** `next-pwa` es un plugin de webpack sin
publicaciones desde 2022 y Next 16 compila con Turbopack, con lo que el build
fallaría. `@serwist/turbopack` compila `src/app/sw.ts` y lo sirve desde
`/serwist/sw.js`.

## Aviso

Ciclos no es un producto sanitario. Las predicciones son estimaciones basadas en
el historial registrado, no sustituyen el criterio médico, y la ventana fértil
que muestra no es un método anticonceptivo.

## Pendiente

- Iconos definitivos: los de `public/` son provisionales, generados por código.
- `public/intro.jpeg` tiene marca de agua de Kathy Schiffer Fine Art; hay que
  sustituirla antes de publicar.
- Gráficos con `recharts` y registro de síntomas.
- Decidir si `suncalc` se aprovecha (amanecer/atardecer) o se retira.
