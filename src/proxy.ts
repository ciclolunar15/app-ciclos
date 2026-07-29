import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * En Next.js 16 el antiguo `middleware.ts` pasa a llamarse `proxy.ts`.
 * Clerk conserva el nombre `clerkMiddleware` para su API, pero el archivo
 * que lo aloja es este.
 *
 * Aquí no se decide quién entra a dónde. Clerk 7 desaconseja expresamente
 * proteger rutas por coincidencia de patrones —`createRouteMatcher` está
 * obsoleto— porque esa coincidencia puede divergir de cómo Next enruta
 * realmente las peticiones y dejar recursos protegidos accesibles.
 *
 * Este proxy solo establece el contexto de sesión. Las comprobaciones reales
 * viven junto a los datos: en el layout de (app) y, sobre todo, en el DAL
 * (src/lib/dal/cycles.ts), que verifica la sesión en cada consulta.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Todo salvo los estáticos de Next y los archivos con extensión.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Las rutas de API y los Server Actions sí, siempre.
    "/(api|trpc)(.*)",
  ],
};
