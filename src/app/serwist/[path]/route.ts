import { createSerwistRoute } from "@serwist/turbopack";

/**
 * Compila y sirve el service worker en /serwist/sw.js.
 *
 * La revisión versiona la página de respaldo sin conexión: al cambiar,
 * Serwist la vuelve a precachear en lugar de servir la copia antigua.
 * En Vercel viene del commit; en local basta con un valor fijo, porque el
 * service worker se reconstruye en cada cambio durante el desarrollo.
 */
const revision =
  process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NODE_ENV ?? "dev";

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [{ url: "/sin-conexion", revision }],
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
  });
