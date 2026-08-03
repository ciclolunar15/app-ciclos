import type { MetadataRoute } from "next";

/**
 * Manifiesto nativo de Next: es lo que hace la app instalable en el móvil,
 * sin depender de ningún paquete externo.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ciclos — tu ciclo y la luna",
    short_name: "Ciclos",
    description:
      "Registra tu ciclo menstrual y observa cómo se acompasa con las fases de la luna.",
    start_url: "/hoy",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es",
    dir: "ltr",
    background_color: "#3d232f",
    theme_color: "#6b3f52",
    categories: ["health", "lifestyle"],
    icons: [
      {
        src: "/icono-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icono-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icono-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
