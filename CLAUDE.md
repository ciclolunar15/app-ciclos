# Proyecto: PWA de Bienestar Femenino (Ciclo Menstrual + Capa Lunar Opcional)

Este documento es el contexto maestro del proyecto. Léelo completo antes de generar código. Cualquier decisión de arquitectura, nomenclatura o alcance debe ser consistente con lo definido acá.

---

## 1. VISIÓN DEL PRODUCTO

No es "otro calendario menstrual". Es una plataforma de bienestar femenino que ayuda a cada usuaria a comprender mejor su cuerpo mediante:

- Registro diario de hábitos y síntomas.
- Análisis de patrones personales (basado únicamente en sus propios datos).
- Predicciones de ciclo y ovulación basadas en evidencia.
- Una capa complementaria y **opcional** de seguimiento lunar, presentada como contenido espiritual/simbólico/de bienestar — nunca como causa de cambios hormonales o emocionales.

El verdadero diferencial no es "menstruación + luna". Es que, después de varios meses de uso, la app aprende de cada usuaria y le devuelve patrones propios (energía baja en tal fase, estrés en tal momento del ciclo, calidad de sueño, síntomas recurrentes, variación del ánimo).

**Regla de oro de contenido:** separar siempre y con claridad visual dos capas:
1. **Información basada en evidencia** (ciclo, hormonas, síntomas, consejos generales de salud).
2. **Información de bienestar** (fase lunar, journaling, mindfulness, simbolismo). Debe quedar explícito en el copy/UI que esta capa no reemplaza consejo médico y no establece relaciones causales con la luna.

---

## 2. FUNCIONALIDADES CORE (MVP)

### Registro diario
La usuaria puede registrar cada día:
- Estado de ánimo
- Energía
- Dolor
- Síntomas (multi-select)
- Sueño (calidad/horas)
- Estrés
- Hidratación
- Actividad física
- Notas libres

### Ciclo menstrual
- Registro de inicio/fin de período.
- Cálculo de día actual del ciclo.
- Cálculo de duración promedio y regularidad.
- Predicción de próximo período.
- Predicción de ventana fértil y ovulación estimada.
- Visualización de fases hormonales (menstrual, folicular, ovulación, lútea) con su explicación educativa.
- Calendario completo navegable.

### Capa lunar (opcional, desactivable)
- Fase lunar actual, % de iluminación, salida/puesta de luna (vía SunCalc, cálculo local, sin API externa).
- Presentada en sección o card claramente diferenciada visualmente del bloque médico.
- Nunca mezclar el copy de "fase lunar" con afirmaciones sobre hormonas/ánimo como si hubiera causalidad.

### Pantalla principal (Home)
Resumen del día:
- Saludo personalizado
- Día del ciclo + fase hormonal
- Fase lunar (si la usuaria activó la capa lunar)
- Próximo período estimado
- Estado de ánimo del día (si ya registró)
- Consejo/tip personalizado del día
- Resumen rápido de bienestar

### Estadísticas
Panel con:
- Evolución de ciclos (duración, regularidad)
- Síntomas más frecuentes
- Variación del estado de ánimo
- Patrones detectados (energía baja en X fase, estrés en Y fase, etc.) — generado únicamente a partir de datos propios de la usuaria, sin heurísticas basadas en la luna.

### Recordatorios
Configurables para: próximo período, ovulación, registro diario, hidratación, medicación, hábitos saludables. Implementados con Web Push API + Service Workers.

---

## 3. FUNCIONALIDADES FUTURAS (post-MVP, no bloquean el desarrollo inicial pero sí deben considerarse en el diseño del schema)

- **Asistente conversacional (IA):** responde usando el historial de la usuaria (ej. "hace 3 días que me siento cansada" → contextualiza con fase del ciclo + recomendaciones generales; puede mencionar fase lunar como dato complementario, siempre aclarando que no reemplaza consejo médico ni implica causalidad). Vía OpenAI API.
- **Vinculación de pareja (Premium):** compartir info del ciclo entre dos cuentas, opt-in explícito, respetando privacidad/consentimiento.
- **Freemium:**
  - Gratis: seguimiento de ciclo, calendario, estadísticas básicas, registro diario, recordatorios, consejos generales.
  - Premium: IA personalizada, estadísticas avanzadas, vinculación de pareja, contenido exclusivo, informes personalizados, funciones avanzadas de bienestar.

Diseñar el modelo de datos y la arquitectura pensando en estos features futuros (ej. tablas preparadas para relaciones entre usuarios, flags de suscripción, etc.), pero **no implementarlos en el MVP**.

---

## 4. DISEÑO / UX

- Minimalista, colores suaves y naturales, mucho espacio en blanco.
- Animaciones fluidas (Framer Motion), sin sobrecargar.
- Sensación de calma, armonía y confianza — no debe sentirse "clínica" ni "gamificada" en exceso.
- Mobile-first, look & feel de app nativa (safe areas, gestos, transiciones).
- Navegación simple: pocas pantallas principales, tab bar inferior probablemente.
- Componentes con shadcn/ui + Tailwind, iconografía Lucide React.

---

## 5. STACK TECNOLÓGICO

**Framework:** Next.js (App Router) + React + TypeScript

**Estilos:** Tailwind CSS + Framer Motion

**Auth:** Clerk

**Base de datos:** PostgreSQL (Supabase) + Prisma ORM

**Validación:** Zod

**Formularios:** React Hook Form (+ Zod resolver)

**Fechas:** date-fns — responsable de: día actual del ciclo, duración del ciclo, próximo período estimado, ventana fértil, ovulación estimada, formateo y comparación de fechas, diffs entre días.

**Calendario lunar:** SunCalc — fase lunar, % iluminación, posición, salida/puesta de luna. Todo calculado localmente a partir de la fecha, sin llamadas externas.

**Gráficos:** Recharts — evolución del ciclo, ánimo, síntomas, sueño, energía, estrés, historial mensual.

**Notificaciones:** Web Push API + Service Workers.

**PWA:** next-pwa — instalable, ícono propio, pantalla completa, funcionamiento offline parcial, caché.

**Estado global:** Zustand — usuario autenticado, estado del ciclo, preferencias, configuración, tema, datos temporales de UI.

**UI:** shadcn/ui + Lucide React

**Archivos (futuro):** UploadThing

**IA (segunda etapa):** OpenAI API

**Analytics (opcional):** Vercel Analytics

**Deploy:** Vercel

---

## 6. ARQUITECTURA

- Next.js App Router como frontend **y** backend (route handlers / server actions para la API interna).
- Toda la lógica de negocio del ciclo menstrual (cálculos, predicciones, detección de patrones) vive en el backend propio — **no depender de APIs externas para funcionalidades críticas**. Las librerías externas (date-fns, SunCalc, Recharts) son solo utilidades de apoyo (cálculo, visualización), nunca fuente de verdad del dominio.
- Prisma como capa de acceso a datos, PostgreSQL (hosteado en Supabase) como store.
- Clerk maneja auth/identidad; el resto de las entidades de dominio (registros diarios, ciclos, síntomas, preferencias) viven en nuestra propia base, referenciando el userId de Clerk.
- Separar claramente en el código (carpetas/módulos) la lógica "médica/evidence-based" de la lógica "bienestar/lunar", reflejando la separación conceptual pedida en el producto.

### Sugerencia de estructura de carpetas
```
/app
  /(marketing)         → landing pública (opcional)
  /(app)
    /home
    /calendar
    /log                → registro diario
    /stats
    /settings
  /api                  → route handlers si hacen falta además de server actions
/components
  /ui                   → shadcn
  /cycle                → componentes del dominio "ciclo/hormonal"
  /wellness             → componentes del dominio "luna/bienestar"
  /charts
/lib
  /cycle                → cálculos de ciclo (date-fns)
  /lunar                → cálculos lunares (SunCalc)
  /stats                → detección de patrones
  /db                    → prisma client
  /validation             → schemas Zod
/prisma
  schema.prisma
/store                  → Zustand stores
```

---

## 7. MODELO DE DATOS (punto de partida sugerido, ajustable)

Entidades mínimas a modelar en Prisma:
- `User` (referenciando Clerk userId)
- `CycleEntry` (inicio/fin de período por ciclo)
- `DailyLog` (fecha, mood, energy, pain, sleepQuality, stress, hydration, activity, notes, symptoms[])
- `Symptom` (catálogo)
- `Reminder` (tipo, frecuencia, horario, activo/inactivo)
- `UserPreferences` (capa lunar activada/desactivada, tema, unidades, etc.)

No modelar todavía: vinculación de pareja, suscripciones Premium, historial de IA — dejar el schema abierto pero no implementarlos.

---

## 8. CÓMO QUIERO QUE TRABAJES (Claude Code)

1. Empezar por el **MVP funcional de un solo usuario**: auth con Clerk, schema Prisma inicial, registro diario, cálculo de ciclo con date-fns, home screen y calendario. La capa lunar y las estadísticas avanzadas pueden ir después, pero dejando la separación de módulos lista desde el principio.
2. Priorizar código tipado, validado con Zod en los bordes (forms y server actions/API).
3. Mantener la separación conceptual "evidencia" vs "bienestar" también en el código (naming de carpetas, componentes, y copy).
4. Ir de a pasos chicos y verificables: proponer plan → confirmar conmigo → implementar → probar.
5. No introducir dependencias fuera de las listadas en la sección 5 sin consultarme antes.