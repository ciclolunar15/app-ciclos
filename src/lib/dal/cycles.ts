import "server-only";

import { auth } from "@clerk/nextjs/server";
import { cache } from "react";

import { prisma } from "@/lib/prisma";
import type { CicloRegistrado } from "@/lib/cycle";

/**
 * Data Access Layer. Todo acceso a los datos de ciclos pasa por aquí.
 *
 * El motivo es que los Server Actions son alcanzables mediante peticiones POST
 * directas, no solo desde la interfaz. Por eso ninguna de estas funciones
 * acepta un userId desde fuera: siempre lo obtiene de la sesión y lo incluye
 * en el `where`, de modo que un id manipulado en el cliente no puede alcanzar
 * los datos de otra persona.
 */

export class NoAutenticada extends Error {
  constructor() {
    super("Se requiere iniciar sesión");
    this.name = "NoAutenticada";
  }
}

/** Id de la usuaria en sesión, o excepción. */
async function requerirUsuarioId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new NoAutenticada();
  return userId;
}

/**
 * Perfil de la usuaria en sesión, creándolo si es su primera visita.
 *
 * `cache` de React deduplica las llamadas dentro de una misma petición: varias
 * páginas y componentes pueden pedirlo sin provocar consultas repetidas.
 */
export const perfilActual = cache(async () => {
  const userId = await requerirUsuarioId();

  return prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });
});

/** Ciclos de la usuaria, del más reciente al más antiguo. */
export const listarCiclos = cache(async (): Promise<CicloRegistrado[]> => {
  const userId = await requerirUsuarioId();

  return prisma.cycle.findMany({
    where: { userId },
    orderBy: { startDate: "desc" },
    select: { id: true, startDate: true, endDate: true },
  });
});

/** Ciclos con sus notas, para la pantalla de registro. */
export const listarCiclosDetallados = cache(async () => {
  const userId = await requerirUsuarioId();

  return prisma.cycle.findMany({
    where: { userId },
    orderBy: { startDate: "desc" },
  });
});

export async function crearCiclo(datos: {
  startDate: Date;
  endDate: Date | null;
  notes: string | null;
}) {
  const userId = await requerirUsuarioId();

  // Se asegura de que el perfil exista antes de colgarle un ciclo.
  await perfilActual();

  return prisma.cycle.create({
    data: { ...datos, userId },
  });
}

export async function actualizarCiclo(
  id: string,
  datos: { startDate: Date; endDate: Date | null; notes: string | null },
) {
  const userId = await requerirUsuarioId();

  // updateMany y no update: `update` busca solo por id y permitiría tocar
  // la fila de otra persona. Con updateMany el userId entra en el filtro.
  const resultado = await prisma.cycle.updateMany({
    where: { id, userId },
    data: datos,
  });

  return resultado.count > 0;
}

export async function borrarCiclo(id: string) {
  const userId = await requerirUsuarioId();

  const resultado = await prisma.cycle.deleteMany({
    where: { id, userId },
  });

  return resultado.count > 0;
}

/** Comprueba si ya existe un ciclo con ese inicio, excluyendo opcionalmente uno. */
export async function existeCicloEnFecha(
  startDate: Date,
  excluyendoId?: string,
): Promise<boolean> {
  const userId = await requerirUsuarioId();

  const encontrado = await prisma.cycle.findFirst({
    where: {
      userId,
      startDate,
      ...(excluyendoId ? { id: { not: excluyendoId } } : {}),
    },
    select: { id: true },
  });

  return encontrado !== null;
}

export async function actualizarPreferencias(datos: {
  hemisphere?: "NORTHERN" | "SOUTHERN";
  timezone?: string;
}) {
  const userId = await requerirUsuarioId();

  return prisma.user.update({
    where: { id: userId },
    data: datos,
  });
}
