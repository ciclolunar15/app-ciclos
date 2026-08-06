import "server-only";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { perfilActual } from "@/lib/dal/cycles";
import { enviarNotificacionPush, notificarAdmins } from "@/lib/dal/notificaciones";

/**
 * DAL del foro comunitario. Mismo criterio que dal/consejos.ts: el userId (y
 * el rol, cuando hace falta) siempre sale de la sesión, nunca de un parámetro
 * que venga del cliente — así ninguna usuaria puede publicar ni borrar en
 * nombre de otra con una petición manipulada.
 */

export class NoAutenticada extends Error {
  constructor() {
    super("Se requiere iniciar sesión");
    this.name = "NoAutenticada";
  }
}

export class NoAutorizada extends Error {
  constructor() {
    super("No podés borrar este post");
    this.name = "NoAutorizada";
  }
}

const LARGO_MAXIMO = 2000;

async function requerirUsuarioId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new NoAutenticada();
  return userId;
}

async function esAdminActual(): Promise<boolean> {
  const usuario = await currentUser();
  return usuario?.publicMetadata?.role === "admin";
}

export type AutorPost = {
  nombre: string;
  fotoUrl: string;
  esAdmin: boolean;
};

export type PostConAutor = {
  id: string;
  contenido: string;
  esAnonimo: boolean;
  createdAt: Date;
  userId: string;
  /** null cuando el post es anónimo: no se expone ni siquiera si es admin. */
  autor: AutorPost | null;
  /** Respuestas del hilo (solo se completa en los posts raíz). */
  respuestas: PostConAutor[];
};

type PostCrudo = {
  id: string;
  contenido: string;
  esAnonimo: boolean;
  createdAt: Date;
  userId: string;
  respuestaAId: string | null;
};

/** Junta los userId de autoras no anónimas y hace una sola consulta batched a Clerk. */
async function resolverAutores(posts: PostCrudo[]): Promise<Map<string, AutorPost>> {
  const idsAMostrar = [...new Set(posts.filter((p) => !p.esAnonimo).map((p) => p.userId))];
  const autoresPorId = new Map<string, AutorPost>();
  if (idsAMostrar.length === 0) return autoresPorId;

  const client = await clerkClient();
  const { data: usuarios } = await client.users.getUserList({
    userId: idsAMostrar,
    limit: idsAMostrar.length,
  });
  for (const usuario of usuarios) {
    autoresPorId.set(usuario.id, {
      nombre: usuario.fullName ?? usuario.firstName ?? "Usuaria",
      fotoUrl: usuario.imageUrl,
      esAdmin: usuario.publicMetadata?.role === "admin",
    });
  }
  return autoresPorId;
}

function conAutor(
  post: PostCrudo,
  autoresPorId: Map<string, AutorPost>,
  respuestas: PostConAutor[] = [],
): PostConAutor {
  return {
    id: post.id,
    contenido: post.contenido,
    esAnonimo: post.esAnonimo,
    createdAt: post.createdAt,
    userId: post.userId,
    autor: post.esAnonimo ? null : (autoresPorId.get(post.userId) ?? null),
    respuestas,
  };
}

/**
 * Hilos más recientes (posts raíz, sin respuestaAId) con sus respuestas
 * anidadas un solo nivel — responder a una respuesta cuelga del mismo hilo
 * raíz, ver crearPost. Los datos de Clerk de todas las autoras involucradas
 * (raíces + respuestas) se resuelven con una sola consulta batched.
 */
export const listarPosts = cache(async (): Promise<PostConAutor[]> => {
  await requerirUsuarioId();

  const raices = await prisma.postForo.findMany({
    where: { respuestaAId: null },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const respuestas =
    raices.length === 0
      ? []
      : await prisma.postForo.findMany({
          where: { respuestaAId: { in: raices.map((r) => r.id) } },
          orderBy: { createdAt: "asc" },
        });

  const autoresPorId = await resolverAutores([...raices, ...respuestas]);

  const respuestasPorRaiz = new Map<string, PostConAutor[]>();
  for (const respuesta of respuestas) {
    const lista = respuestasPorRaiz.get(respuesta.respuestaAId!) ?? [];
    lista.push(conAutor(respuesta, autoresPorId));
    respuestasPorRaiz.set(respuesta.respuestaAId!, lista);
  }

  return raices.map((raiz) => conAutor(raiz, autoresPorId, respuestasPorRaiz.get(raiz.id) ?? []));
});

export async function crearPost(datos: {
  contenido: string;
  esAnonimo: boolean;
  respuestaAId?: string | null;
}) {
  const userId = await requerirUsuarioId();

  const contenido = datos.contenido.trim();
  if (contenido === "") throw new Error("El post no puede estar vacío.");
  if (contenido.length > LARGO_MAXIMO) {
    throw new Error(`El post es demasiado largo (máximo ${LARGO_MAXIMO} caracteres).`);
  }

  let respuestaAId = datos.respuestaAId ?? null;
  // A quién avisar: siempre la autora del mensaje puntual al que se le dio
  // "Responder" (no necesariamente la raíz del hilo, si el hilo ya tenía
  // varias respuestas).
  let autorAAvisarId: string | null = null;
  if (respuestaAId) {
    const objetivo = await prisma.postForo.findUnique({
      where: { id: respuestaAId },
      select: { respuestaAId: true, userId: true },
    });
    if (!objetivo) throw new Error("El mensaje al que intentás responder ya no existe.");
    autorAAvisarId = objetivo.userId;
    // Aplana: responder a una respuesta cuelga del mismo hilo raíz, nunca
    // se anida un nivel más.
    respuestaAId = objetivo.respuestaAId ?? respuestaAId;
  }

  // Se asegura de que el perfil exista antes de colgarle un post.
  await perfilActual();

  const post = await prisma.postForo.create({
    data: { userId, contenido, esAnonimo: datos.esAnonimo, respuestaAId },
  });

  // No te notifica si te respondés a vos misma. Si el envío falla, no debe
  // tirar abajo la publicación: enviarNotificacionPush ya no relanza errores
  // de suscripciones individuales.
  if (autorAAvisarId && autorAAvisarId !== userId) {
    await enviarNotificacionPush(autorAAvisarId, {
      titulo: "Nueva respuesta en el foro",
      cuerpo: "Alguien respondió tu publicación.",
      url: "/foro",
    });
  }

  // Aviso aparte para mantener a la administradora al tanto de toda
  // actividad del foro (no solo cuando le responden a ella), sin revelar
  // autora ni contenido — coherente con la regla de anonimato.
  await notificarAdmins(
    { titulo: "Maresa · Foro", cuerpo: "Hay una nueva publicación en el foro.", url: "/foro" },
    userId,
  );

  return post;
}

export async function borrarPost(id: string) {
  const userId = await requerirUsuarioId();

  const post = await prisma.postForo.findUnique({ where: { id } });
  if (!post) return false;

  if (post.userId !== userId && !(await esAdminActual())) {
    throw new NoAutorizada();
  }

  const resultado = await prisma.postForo.deleteMany({
    where: post.userId === userId ? { id, userId } : { id },
  });
  return resultado.count > 0;
}
