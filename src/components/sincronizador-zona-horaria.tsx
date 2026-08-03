"use client";

import { useEffect } from "react";

import { sincronizarZonaHoraria } from "@/app/(app)/acciones-perfil";

/**
 * Corrige en segundo plano el huso horario del perfil si no coincide con el
 * del navegador (el perfil nace en Europe/Madrid por defecto). No renderiza
 * nada visible.
 */
export function SincronizadorZonaHoraria({ zonaActual }: { zonaActual: string }) {
  useEffect(() => {
    const zonaDelNavegador = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zonaDelNavegador && zonaDelNavegador !== zonaActual) {
      void sincronizarZonaHoraria(zonaDelNavegador);
    }
  }, [zonaActual]);

  return null;
}
