import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

/**
 * DAL del conjunto de imágenes del sincronario. Es una lista acumulable
 * (cada subida agrega una fila, no reemplaza nada) con un tope fijo — ver
 * LIMITE_IMAGENES.
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

export const LIMITE_IMAGENES = 5;

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

export async function contarImagenesSincronario(): Promise<number> {
  await requerirAdmin();
  return prisma.imagenSincronario.count();
}

/**
 * createMany es una sola sentencia SQL: o entran todas las imágenes del
 * lote, o ninguna — evita quedar con un lote a medio subir si una imagen
 * más adelante en la lista falla.
 */
export async function guardarImagenesSincronario(items: { datos: Buffer; tipoMime: string }[]) {
  const subidaPor = await requerirAdmin();
  await prisma.imagenSincronario.createMany({
    data: items.map((item) => ({
      datos: Buffer.from(item.datos),
      tipoMime: item.tipoMime,
      subidaPor,
    })),
  });
}

export async function eliminarImagenSincronario(id: string) {
  await requerirAdmin();
  await prisma.imagenSincronario.deleteMany({ where: { id } });
}

/** Metadata liviana (sin los bytes), en orden de subida — la usan las páginas. */
export async function listarImagenesSincronario() {
  await requerirUsuarioId();
  return prisma.imagenSincronario.findMany({
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

/** Con los bytes de una imagen puntual: la usa exclusivamente el route handler. */
export async function obtenerBytesImagenSincronario(id: string) {
  await requerirUsuarioId();
  return prisma.imagenSincronario.findUnique({
    where: { id },
    select: { datos: true, tipoMime: true },
  });
}
