# Maresa

Plataforma de bienestar femenino: seguimiento del ciclo menstrual basado en
evidencia, con una capa opcional de contenido espiritual/simbólico (fases
lunares, calendario de 13 lunas, consejos curados por una administradora).
Aplicación web instalable (PWA), multiusuario y en español.

## Qué es Maresa

No es "otro calendario menstrual". La idea de fondo es que, con el tiempo,
la app aprenda de los propios datos de cada usuaria y le devuelva patrones
personales (energía baja en tal fase, síntomas recurrentes, cómo varía su
ánimo) — no reglas genéricas de internet.

Para que eso sea confiable, el producto separa siempre dos capas de
contenido, tanto en el código como en la interfaz:

1. **Capa basada en evidencia**: ciclo, fases hormonales, predicciones,
   estadísticas. Vive en `src/lib/cycle.ts` y se calcula únicamente a partir
   de los periodos que la propia usuaria registró.
2. **Capa de bienestar/simbólica**: fase lunar, calendario de 13 lunas
   ("sincronario"), consejos de la administradora. Vive en `src/lib/moon.ts`
   y `src/lib/sincronario.ts`. Se presenta siempre visualmente diferenciada
   de la capa médica, y su copy nunca afirma una relación causal entre la
   luna y el cuerpo o el ánimo — ver el aviso al final de este documento.

## Funcionalidades

- **Hoy** (`/hoy`): resumen del día — en qué día y fase del ciclo estás, qué
  fase lunar hay, y la predicción del próximo periodo.
- **Calendario** (`/calendario`): dos vistas sobre las mismas fechas.
  - **Ciclo**: mes en formato tradicional, con el periodo registrado, el
    previsto, la fase de cada día y la fase lunar.
  - **Sincronario**: el mismo rango de fechas, pero organizado como el
    calendario de 13 lunas de 28 días (ver más abajo).
  - Tocar cualquier día de cualquiera de las dos vistas muestra, debajo, los
    consejos que la administradora cargó para la combinación de fase del
    ciclo + fase lunar de ese día.
- **Registro** (`/registro`): alta, edición y borrado de periodos, e
  historial completo.
- **Admin** (`/admin/consejos`, solo visible para cuentas admin): carga de
  los consejos de bienestar que ven las usuarias.
- Instalable como app (PWA), con ícono propio y funcionamiento offline
  parcial.

## Cómo se calculan las predicciones

Todo lo que sigue vive en `src/lib/cycle.ts`, que envuelve la librería
[`cyclia`](https://www.npmjs.com/package/cyclia) — la app nunca le pide
nada a un servidor externo para esto, todo sale del historial de periodos
que la usuaria ya cargó.

**Duración del ciclo.** Con cada periodo nuevo que se registra, se
recalculan los intervalos entre inicios de periodo consecutivos. `cyclia`
usa una **media móvil ponderada (WMA)**: los ciclos más recientes pesan más
que los antiguos en el promedio. Por eso el copy de la landing dice "las
estimaciones se recalculan con cada periodo, dando más peso a los ciclos
recientes" — no es una frase de marketing, es literalmente cómo funciona el
algoritmo. Con menos de dos periodos registrados no hay ningún intervalo
que promediar, así que no hay predicción todavía.

**Próximo periodo.** Es la fecha del último periodo más la duración de
ciclo estimada (la media móvil ponderada de arriba). Se muestra junto a un
margen razonable alrededor de esa fecha, no como una fecha exacta.

**Ovulación y ventana fértil: por qué no es "siempre el día 14".** La
duración total del ciclo varía mucho entre personas (y entre ciclos de la
misma persona) casi siempre por la fase **folicular** (del inicio del
sangrado a la ovulación), que es la parte más variable. La fase **lútea**
(de la ovulación al siguiente periodo) es clínicamente mucho más estable,
alrededor de 14 días. Por eso la app **ancla la ovulación desde el final
del ciclo hacia atrás** — `día de ovulación = duración del ciclo − 14` — en
vez de contar 14 días desde el inicio. Esto es la constante
`DIAS_FASE_LUTEA` en `lib/cycle.ts`, y es lo que hace que la estimación siga
teniendo sentido tanto para un ciclo de 24 días como para uno de 35 — con un
piso de seguridad (`diasSangrado + 3`) para que un ciclo muy corto
registrado no dé una ovulación antes de terminar el sangrado. La ventana
fértil que se muestra es la estimación de `cyclia` alrededor de esa fecha de
ovulación.

**Las 4 fases y sus límites** (`faseDelCiclo()`):
- **Menstrual**: desde el día 1 hasta el fin del sangrado (por defecto 5
  días, o los días reales del último sangrado si se registró el fin).
- **Pre ovulación** (folicular): desde el fin del sangrado hasta ~2 días
  antes de la ovulación estimada.
- **Ovulación** (ovulatoria): una ventana de ±2 días alrededor del día de
  ovulación estimado.
- **Pre menstrual** (lútea): desde el fin de la ovulación hasta el próximo
  periodo.

**Fiabilidad, no porcentaje.** `cyclia` calcula una confianza numérica, pero
es deliberadamente conservadora — con seis ciclos perfectamente regulares
puede dar apenas 0,48. Mostrar eso como "48%" generaría alarma sin motivo,
así que se traduce a 4 niveles cualitativos (`nivelFiabilidad()` en
`lib/cycle.ts`):

| Nivel | Cuándo aplica |
|---|---|
| Sin datos suficientes | Menos de un intervalo medido (0 o 1 periodo) |
| Fiabilidad baja | Confianza y calidad de datos bajas |
| Fiabilidad media | Calidad de datos media, o confianza ≥ 0,20 |
| Fiabilidad alta | Calidad de datos alta, o confianza ≥ 0,45 |

**Un detalle técnico que importa:** `cyclia` devuelve la fecha centinela
`1970-01-01` (época Unix) en vez de `null` cuando no tiene datos
suficientes para predecir ovulación o ventana fértil — es un comportamiento
comprobado de la librería, no un bug propio. El adaptador en `lib/cycle.ts`
filtra esa fecha explícitamente (`fechaValida()`) para no mostrarle nunca a
una usuaria una predicción de 1970.

**Fechas civiles, no timestamps.** Un periodo se guarda como fecha sin hora
(`@db.Date`) y todo el cálculo usa accesores UTC. La zona horaria del
cálculo es la de cada usuaria (autodetectada por el navegador, ver más
abajo) — sin esto, un periodo anotado a las 23:00 podría registrarse como
el día siguiente según en qué huso corriera el servidor.

## La capa lunar y el sincronario

**Fase lunar** (`src/lib/moon.ts`, vía `lunarphase-js`): se calcula de forma
puramente astronómica a partir de la fecha y el mes sinódico (~29,53 días),
sin red ni estado — determinista, corre igual en el servidor. Se ajusta por
hemisferio (una luna creciente en el hemisferio norte se ve como menguante
en el sur).

**Sincronario** (`src/lib/sincronario.ts`): el calendario de 13 lunas de
José y Lloydine Argüelles (sistema Dreamspell), ofrecido como alternativa
simbólica al mes gregoriano dentro de `/calendario`. 13 lunas de 28 días
(364 días) más el 25 de julio, el "Día Fuera del Tiempo", que no pertenece
a ninguna luna — 365 días en total. En años bisiestos se agrega el 29 de
febrero como "Hunab Ku", un día intercalar que tampoco cuenta dentro de
ninguna luna (para que el resto del año no se desplace). Cada día tiene
además un "Kin" (1-260): un conteo cíclico independiente y continuo
(Tzolkin), calculado como los días transcurridos desde una época de
referencia (26 de julio de 1987 = Kin 1) módulo 260. Todos estos datos
están verificados contra fuentes del propio sistema Dreamspell, no
inventados.

Ninguno de los dos cálculos anteriores se mezcla nunca con `lib/cycle.ts`
ni influye en él — son puramente informativos/simbólicos.

## Consejos de la administradora

Una cuenta marcada con `publicMetadata.role = "admin"` en el dashboard de
Clerk (no hay UI en la app para asignar el rol, se hace a mano) puede
cargar, desde `/admin/consejos`, textos de bienestar etiquetados con una de
4 fases del ciclo (Menstrual / Pre ovulación / Ovulación / Pre menstrual) y
una de 4 fases lunares amplias (Nueva / Creciente / Llena / Menguante) — 16
combinaciones posibles, cada una con cero, uno o varios consejos. Al tocar
un día en el calendario (Ciclo o Sincronario), la usuaria ve los consejos
que coinciden con la combinación real de ese día. El rol se verifica del
lado del servidor con `currentUser()` en `lib/dal/consejos.ts`, nunca solo
ocultando un botón en la interfaz.

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
prisma/schema.prisma            Modelo de datos
prisma.config.ts                Configuración de Prisma 7
src/
  proxy.ts                      Contexto de sesión de Clerk (antes middleware.ts)
  generated/prisma/             Cliente Prisma generado — no se versiona
  lib/
    prisma.ts                   Cliente con driver adapter de Postgres
    cycle.ts                    Predicción del ciclo (adaptador sobre cyclia)
    moon.ts                     Fases lunares en español
    sincronario.ts               Calendario de 13 lunas / Dreamspell
    format.ts                   Formateo de fechas
    dal/cycles.ts                Data Access Layer de ciclos y perfil
    dal/consejos.ts              Data Access Layer de consejos (admin)
  app/
    page.tsx                    Landing pública
    manifest.ts                 Manifiesto de la PWA
    sw.ts                       Service worker (Serwist)
    serwist/[path]/route.ts     Compila y sirve el service worker
    (auth)/                     Entrar y registrarse
    (app)/acciones-perfil.ts     Server Action: autodetección de huso horario
    (app)/hoy                   Pantalla principal
    (app)/calendario            Calendario (Ciclo + Sincronario) y consejos
    (app)/registro              Historial y alta de periodos
    (app)/admin/consejos        Alta/borrado de consejos (solo admin)
  components/                    Componentes compartidos
```

## Decisiones que conviene conocer

**Las fechas de ciclo son fechas civiles, sin hora.** Se guardan como `@db.Date`
y se manipulan siempre con accesores UTC (`src/lib/cycle.ts`). Sin esta
disciplina, un periodo anotado a las 23:00 se almacenaría como el día anterior.
Los formateadores de `src/lib/format.ts` fijan `timeZone: "UTC"` por el mismo
motivo.

**El huso horario del perfil se autodetecta.** El perfil nace con
`Europe/Madrid` por defecto (valor del schema); `SincronizadorZonaHoraria`
(componente cliente montado en el layout de `(app)`) compara ese valor con
`Intl.DateTimeFormat().resolvedOptions().timeZone` del navegador y, si
difieren, lo corrige en segundo plano vía Server Action. Sin esto, "hoy"
podía calcularse mal para cualquier usuaria fuera de Europa.

**Toda consulta pasa por el DAL.** Los Server Functions son alcanzables por POST
directo, no solo desde la interfaz, así que ninguna función del DAL acepta un
`userId` desde fuera: lo toma de la sesión y lo incluye en el `where`. Las
operaciones de modificación usan `updateMany`/`deleteMany` en vez de
`update`/`delete` precisamente para que el `userId` entre en el filtro. El
DAL de administración (`dal/consejos.ts`) sigue el mismo criterio con el
rol: `requerirAdmin()` se vuelve a comprobar en cada consulta/mutación, no
solo una vez al cargar la página.

**La autenticación se comprueba junto al recurso, no por patrón de ruta.**
Clerk 7 desaconseja `createRouteMatcher` porque la coincidencia de rutas puede
divergir de cómo Next enruta las peticiones. `proxy.ts` solo establece el
contexto; quien decide es el layout de `(app)` y el DAL.

**La predicción viene de [`cyclia`](https://www.npmjs.com/package/cyclia)**
(estrategia de media móvil ponderada), envuelta en `src/lib/cycle.ts` — ver
la sección "Cómo se calculan las predicciones" más arriba para el
razonamiento completo.

**La PWA usa Serwist, no `next-pwa`.** `next-pwa` es un plugin de webpack sin
publicaciones desde 2022 y Next 16 compila con Turbopack, con lo que el build
fallaría. `@serwist/turbopack` compila `src/app/sw.ts` y lo sirve desde
`/serwist/sw.js`.

## Aviso

Maresa no es un producto sanitario. Las predicciones son estimaciones basadas en
el historial registrado, no sustituyen el criterio médico, y la ventana fértil
que muestra no es un método anticonceptivo. La fase lunar y el sincronario son
contenido simbólico/espiritual: no implican ninguna relación causal con el
cuerpo, las hormonas o el ánimo.

## Pendiente

- Iconos definitivos: los de `public/` son provisionales, generados por código.
- `public/intro.jpeg` tiene marca de agua de Kathy Schiffer Fine Art; hay que
  sustituirla antes de publicar.
- Gráficos con `recharts` y registro de síntomas.
- Decidir si `suncalc` se aprovecha (amanecer/atardecer) o se retira.
- Contenido real de rituales/recetas del sincronario: pendiente de que el
  cliente mande material concreto (ver notas de la app, no inventar
  contenido espiritual sin fuente).
