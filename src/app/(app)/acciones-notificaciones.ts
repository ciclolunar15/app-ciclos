"use server";

import { borrarSuscripcion, guardarSuscripcion } from "@/lib/dal/notificaciones";

/**
 * No es específica del foro: cualquier pantalla que necesite pedir permiso
 * de notificaciones puede llamar a estas acciones (ver plan de
 * notificaciones push — la idea es reusarlas para los recordatorios de
 * ciclo más adelante).
 */

export async function accionGuardarSuscripcionPush(suscripcion: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<{ ok: boolean }> {
  try {
    await guardarSuscripcion(suscripcion);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function accionBorrarSuscripcionPush(endpoint: string): Promise<void> {
  await borrarSuscripcion(endpoint);
}
