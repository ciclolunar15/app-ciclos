"use client";

import { useEffect, useState } from "react";

export type EventoInstalacion = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Solo Chrome/Android (y derivados basados en Chromium) disparan
 * "beforeinstallprompt". Safari/iOS no lo soporta — ahí este hook nunca
 * entrega un evento, la única vía sigue siendo "Compartir" → "Agregar a
 * pantalla de inicio", manual.
 *
 * Compartido entre BotonInstalarPwa (pill chico, header de app/auth) y
 * BannerInstalarPwa (banner fijo arriba de todo, landing) — misma lógica,
 * presentación distinta según dónde se usa.
 */
export function useEventoInstalacion() {
  const [evento, setEvento] = useState<EventoInstalacion | null>(null);

  useEffect(() => {
    function alDisponible(e: Event) {
      e.preventDefault();
      setEvento(e as EventoInstalacion);
    }
    function alInstalar() {
      setEvento(null);
    }
    window.addEventListener("beforeinstallprompt", alDisponible);
    window.addEventListener("appinstalled", alInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", alDisponible);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    await evento.userChoice;
    setEvento(null);
  }

  return { disponible: evento !== null, instalar };
}
