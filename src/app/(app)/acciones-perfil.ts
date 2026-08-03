"use server";

import { revalidatePath } from "next/cache";

import { actualizarPreferencias } from "@/lib/dal/cycles";

function esZonaValida(zona: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: zona });
    return true;
  } catch {
    return false;
  }
}

/**
 * El perfil se crea con Europe/Madrid por defecto (ver schema.prisma) y nada
 * lo corrige solo. Esta acción la llama un componente cliente apenas detecta
 * que el huso real del navegador no coincide con el guardado, para que "hoy"
 * (usado en /hoy, /calendario y el sincronario) se calcule con la zona real.
 */
export async function sincronizarZonaHoraria(zona: string): Promise<void> {
  if (!esZonaValida(zona)) return;

  await actualizarPreferencias({ timezone: zona });

  revalidatePath("/hoy");
  revalidatePath("/calendario");
  revalidatePath("/registro");
}
