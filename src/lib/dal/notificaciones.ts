import "server-only";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { sendNotification, setVapidDetails, WebPushError } from "web-push";

import { prisma } from "@/lib/prisma";
import { perfilActual } from "@/lib/dal/cycles";

/**
 * DAL de notificaciones push. Genérico a propósito: no es solo del foro, es
 * la base que en el futuro también van a usar los recordatorios de ciclo
 * (ver CLAUDE.md). Mismo criterio del resto: el userId sale de la sesión.
 */

export class NoAutenticada extends Error {
  constructor() {
    super("Se requiere iniciar sesión");
    this.name = "NoAutenticada";
  }
}

async function requerirUsuarioId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new NoAutenticada();
  return userId;
}

let vapidConfigurado = false;
/** setVapidDetails es global al proceso: alcanza con llamarlo una vez. */
function asegurarVapid() {
  if (vapidConfigurado) return;
  setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  vapidConfigurado = true;
}

/** Guarda o actualiza (por endpoint) la suscripción de este dispositivo. */
export async function guardarSuscripcion(datos: {
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  const userId = await requerirUsuarioId();
  await perfilActual();

  return prisma.pushSubscription.upsert({
    where: { endpoint: datos.endpoint },
    update: { userId, p256dh: datos.p256dh, auth: datos.auth },
    create: { userId, endpoint: datos.endpoint, p256dh: datos.p256dh, auth: datos.auth },
  });
}

/** El navegador informa que esta suscripción ya no es válida. */
export async function borrarSuscripcion(endpoint: string) {
  const userId = await requerirUsuarioId();
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
}

/**
 * Manda un push a todos los dispositivos de userId. No tira si falla: una
 * notificación que no llega no debe romper la acción que la disparó (p. ej.
 * publicar una respuesta). Las suscripciones vencidas (404/410) se borran solas.
 */
export async function enviarNotificacionPush(
  userId: string,
  datos: { titulo: string; cuerpo: string; url: string },
) {
  const suscripciones = await prisma.pushSubscription.findMany({ where: { userId } });
  if (suscripciones.length === 0) return;

  asegurarVapid();
  const payload = JSON.stringify({ title: datos.titulo, body: datos.cuerpo, url: datos.url });

  await Promise.all(
    suscripciones.map(async (suscripcion) => {
      try {
        await sendNotification(
          {
            endpoint: suscripcion.endpoint,
            keys: { p256dh: suscripcion.p256dh, auth: suscripcion.auth },
          },
          payload,
        );
      } catch (error) {
        if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) {
          await prisma.pushSubscription.deleteMany({ where: { id: suscripcion.id } });
        }
      }
    }),
  );
}

/**
 * Avisa a todas las administradoras (publicMetadata.role === "admin" en
 * Clerk — no hay tabla propia de roles). Resuelto dinámicamente en vez de
 * un id fijo: si el cliente agrega una segunda admin, recibe el aviso sin
 * tocar código. excluirUserId evita avisarle a la propia autora del post.
 */
export async function notificarAdmins(
  datos: { titulo: string; cuerpo: string; url: string },
  excluirUserId?: string,
) {
  const client = await clerkClient();
  const { data: usuarios } = await client.users.getUserList({ limit: 500 });
  const admins = usuarios.filter(
    (usuario) => usuario.publicMetadata?.role === "admin" && usuario.id !== excluirUserId,
  );

  await Promise.all(admins.map((admin) => enviarNotificacionPush(admin.id, datos)));
}
