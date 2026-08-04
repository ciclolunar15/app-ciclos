"use client";

import { useEffect } from "react";
import { useSerwist } from "@serwist/turbopack/react";

/**
 * sw.ts ya activa cada versión nueva enseguida (skipWaiting + clientsClaim),
 * pero eso solo pasa en segundo plano: una PWA ya abierta se queda mostrando
 * el HTML/CSS que tenía en memoria hasta que alguien la recarga. Esto
 * recarga una sola vez apenas el service worker nuevo toma el control
 * (isUpdate: true excluye el primer registro, que no debe recargar nada).
 */
export function ActualizadorServiceWorker() {
  const { serwist } = useSerwist();

  useEffect(() => {
    if (!serwist) return;

    function alControlar(evento: { isUpdate?: boolean }) {
      if (evento.isUpdate) window.location.reload();
    }

    serwist.addEventListener("controlling", alControlar);
    return () => serwist.removeEventListener("controlling", alControlar);
  }, [serwist]);

  return null;
}
