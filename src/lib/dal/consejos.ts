import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";

import { prisma } from "@/lib/prisma";
import type { FaseCiclo } from "@/lib/cycle";
import type { FaseLunarAmplia } from "@/lib/moon";
import type { FaseCicloConsejo, FaseLunarConsejo } from "@/generated/prisma/client";

/**
 * DAL de consejos de bienestar. Mismo criterio que dal/cycles.ts: el userId
 * (y acá también el rol) siempre sale de la sesión, nunca de un parámetro que
 * venga del cliente.
 */

export class NoAutenticada extends Error {
  constructor() {
    super("Se requiere iniciar sesión");
    this.name = "NoAutenticada";
  }
}

export class NoAutorizada extends Error {
  constructor() {
    super("Se requiere ser administradora");
    this.name = "NoAutorizada";
  }
}

async function requerirUsuarioId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new NoAutenticada();
  return userId;
}

/**
 * `currentUser()` trae el objeto completo de Clerk (incluido publicMetadata)
 * sin depender de configurar reclamos custom en el token de sesión — es la
 * forma soportada de leer un rol que no puede manipular quien inicia sesión.
 */
async function requerirAdmin(): Promise<string> {
  const userId = await requerirUsuarioId();
  const usuario = await currentUser();
  if (usuario?.publicMetadata?.role !== "admin") throw new NoAutorizada();
  return userId;
}

const MAPA_FASE_CICLO: Record<FaseCiclo, FaseCicloConsejo> = {
  menstrual: "MENSTRUAL",
  folicular: "PRE_OVULACION",
  ovulatoria: "OVULACION",
  lutea: "PRE_MENSTRUAL",
};

const MAPA_FASE_LUNAR: Record<FaseLunarAmplia, FaseLunarConsejo> = {
  nueva: "NUEVA",
  creciente: "CRECIENTE",
  llena: "LLENA",
  menguante: "MENGUANTE",
};

/** Consejos para una combinación fase de ciclo + fase lunar. Lectura pública (cualquier usuaria autenticada). */
export const listarConsejosPara = cache(
  async (faseCiclo: FaseCiclo | null, faseLunar: FaseLunarAmplia) => {
    await requerirUsuarioId();
    if (!faseCiclo) return [];

    return prisma.consejo.findMany({
      where: {
        faseCiclo: MAPA_FASE_CICLO[faseCiclo],
        faseLunar: MAPA_FASE_LUNAR[faseLunar],
      },
      orderBy: { createdAt: "asc" },
    });
  },
);

/** Todos los consejos, para la pantalla de administración. */
export const listarTodosLosConsejos = cache(async () => {
  await requerirAdmin();
  return prisma.consejo.findMany({ orderBy: { createdAt: "desc" } });
});

export async function crearConsejo(datos: {
  faseCiclo: FaseCicloConsejo;
  faseLunar: FaseLunarConsejo;
  texto: string;
}) {
  const userId = await requerirAdmin();

  return prisma.consejo.create({
    data: { ...datos, creadoPor: userId },
  });
}

export async function borrarConsejo(id: string) {
  await requerirAdmin();
  const resultado = await prisma.consejo.deleteMany({ where: { id } });
  return resultado.count > 0;
}
