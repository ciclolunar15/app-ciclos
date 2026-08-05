import path from "node:path";

import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Hay un package-lock.json en el directorio personal del usuario, y sin
    // esto Turbopack lo toma como raíz del espacio de trabajo.
    root: path.resolve(import.meta.dirname),
  },
  images: {
    // Fotos de perfil de las usuarias en el foro (dal/foro.ts las trae de
    // Clerk). El UserButton del header maneja su propio avatar sin pasar por
    // next/image, así que hasta el foro no hacía falta esto.
    remotePatterns: [{ protocol: "https", hostname: "img.clerk.com" }],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

// withSerwist añade esbuild a serverExternalPackages, necesario para que el
// service worker se compile en tiempo de ejecución de la ruta /serwist.
export default withSerwist(nextConfig);
