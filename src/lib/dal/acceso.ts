import "server-only";

import { randomInt } from "node:crypto";
import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { perfilActual } from "@/lib/dal/cycles";

/**
 * DAL del acceso pago. Mismo criterio que el resto: el userId (y el rol,
 * cuando hace falta) siempre sale de la sesión.
 *
 * El acceso se resuelve consultando si esta usuaria canjeó ALGUNA VEZ un
 * código, no si el que canjeó sigue siendo el vigente — es permanente, y por
 * eso no hace falta ningún campo en User. Generar un código nuevo solo
 * habilita a la próxima persona; nunca revoca a las que ya entraron.
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

// Sin 0/O/1/I/L: se lee y se transcribe a mano por WhatsApp, así que evita
// caracteres que se confunden entre sí.
const ALFABETO_CODIGO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LARGO_CODIGO = 5;

/** Tope de intentos fallidos antes de bloquear el canje para esa usuaria. */
const LIMITE_INTENTOS = 5;

async function requerirUsuarioId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new NoAutenticada();
  return userId;
}

async function requerirAdmin(): Promise<string> {
  const userId = await requerirUsuarioId();
  const usuario = await currentUser();
  if (usuario?.publicMetadata?.role !== "admin") throw new NoAutorizada();
  return userId;
}

function generarCadena(): string {
  let resultado = "";
  for (let i = 0; i < LARGO_CODIGO; i++) {
    resultado += ALFABETO_CODIGO[randomInt(ALFABETO_CODIGO.length)];
  }
  return resultado;
}

export async function generarCodigo() {
  const creadoPor = await requerirAdmin();
  return prisma.codigoAcceso.create({
    data: { codigo: generarCadena(), creadoPor },
  });
}

/** El código sin usar más reciente: el único vigente para canjear. */
export async function codigoVigente() {
  await requerirAdmin();
  return prisma.codigoAcceso.findFirst({
    where: { usadoPorId: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function tieneAcceso(): Promise<boolean> {
  const userId = await requerirUsuarioId();
  const usuario = await currentUser();
  if (usuario?.publicMetadata?.role === "admin") return true;

  const usado = await prisma.codigoAcceso.findFirst({ where: { usadoPorId: userId } });
  return usado !== null;
}

export type ResultadoCanje =
  | { ok: true }
  | { ok: false; motivo: "bloqueada" | "incorrecto" };

/**
 * Cada intento fallido suma uno a intentosCodigoFallidos; al llegar a
 * LIMITE_INTENTOS, ni siquiera se llega a comparar el código. Es por
 * usuaria, no por código — generar un código nuevo no desbloquea a nadie.
 */
export async function canjearCodigo(codigoIngresado: string): Promise<ResultadoCanje> {
  const userId = await requerirUsuarioId();
  // Se asegura de que el perfil exista: hace falta desde el primer intento
  // (no solo al canjear con éxito) para poder contar los fallidos.
  const perfil = await perfilActual();

  if (perfil.intentosCodigoFallidos >= LIMITE_INTENTOS) {
    return { ok: false, motivo: "bloqueada" };
  }

  const normalizado = codigoIngresado.trim().toUpperCase();
  const vigente = await prisma.codigoAcceso.findFirst({
    where: { usadoPorId: null },
    orderBy: { createdAt: "desc" },
  });

  if (!vigente || vigente.codigo !== normalizado) {
    await prisma.user.update({
      where: { id: userId },
      data: { intentosCodigoFallidos: { increment: 1 } },
    });
    return { ok: false, motivo: "incorrecto" };
  }

  // updateMany con el guard usadoPorId: null, no update: si dos personas
  // mandan el mismo código al mismo tiempo, que gane una sola.
  const resultado = await prisma.codigoAcceso.updateMany({
    where: { id: vigente.id, usadoPorId: null },
    data: { usadoPorId: userId, usadoEn: new Date() },
  });

  if (resultado.count === 0) {
    // Alguien más lo canjeó en el mismo instante: para esta usuaria sigue
    // siendo un intento fallido.
    await prisma.user.update({
      where: { id: userId },
      data: { intentosCodigoFallidos: { increment: 1 } },
    });
    return { ok: false, motivo: "incorrecto" };
  }

  return { ok: true };
}
