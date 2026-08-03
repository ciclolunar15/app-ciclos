"use client";

import { useEffect, useState } from "react";

type EventoInstalacion = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Solo Chrome/Android (y derivados basados en Chromium) disparan
 * "beforeinstallprompt". Safari/iOS no lo soporta, así que ahí el botón
 * nunca aparece — la única vía en ese caso sigue siendo "Compartir" →
 * "Agregar a pantalla de inicio", manual.
 */
export function BotonInstalarPwa() {
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

  if (!evento) return null;

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    await evento.userChoice;
    setEvento(null);
  }

  return (
    <button
      type="button"
      onClick={instalar}
      className="flex items-center gap-1 rounded-full bg-luna px-3 py-1 text-xs font-semibold text-abismo shadow-sm transition-colors hover:bg-luna/90"
    >
      <span aria-hidden>⬇</span>
      Instalar
    </button>
  );
}
