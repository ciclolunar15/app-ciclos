import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { diasEntre, estadoActual, hoy, predecir, type CicloRegistrado, type FaseCiclo } from "@/lib/cycle";
import { enviarNotificacionPush } from "@/lib/dal/notificaciones";

/**
 * Cron diario (ver vercel.json) que revisa a todas las usuarias y manda los
 * avisos de fase/período que correspondan. Nadie "hace" nada el día que
 * empieza la ovulación, así que a diferencia del resto de las notificaciones
 * (disparadas por una acción puntual) esto necesita un disparador por tiempo.
 *
 * El inicio de la fase menstrual no lleva aviso: lo registra la propia
 * usuaria a mano, avisarle de algo que ella misma acaba de anotar no aporta.
 */

const COPY_FASE: Record<Exclude<FaseCiclo, "menstrual">, { titulo: string; cuerpo: string }> = {
  folicular: {
    titulo: "Empezó tu etapa pre-ovulación",
    cuerpo: "Es una buena fase para energía y planificación.",
  },
  ovulatoria: {
    titulo: "Empezó tu etapa de ovulación",
    cuerpo: "Estás en tu ventana fértil estimada.",
  },
  lutea: {
    titulo: "Empezó tu etapa pre-menstrual",
    cuerpo: "Pueden aparecer cambios de ánimo o síntomas físicos.",
  },
};

const DIAS_AVISO_PROXIMO = 2;

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const usuarias = await prisma.user.findMany({ include: { cycles: true } });

  for (const usuaria of usuarias) {
    const ciclos: CicloRegistrado[] = usuaria.cycles;
    if (ciclos.length === 0) continue;

    const fechaDeHoy = hoy(usuaria.timezone);
    const estado = estadoActual(ciclos, fechaDeHoy);
    const cambios: {
      notificacionFaseCiclo?: string;
      notificacionPeriodoProximo?: Date;
      notificacionPeriodoHoy?: Date;
    } = {};

    if (estado.fase && estado.fase !== "menstrual" && estado.fase !== usuaria.notificacionFaseCiclo) {
      await enviarNotificacionPush(usuaria.id, { ...COPY_FASE[estado.fase], url: "/hoy" });
      cambios.notificacionFaseCiclo = estado.fase;
    }

    const { proximoPeriodo } = predecir(ciclos);
    if (proximoPeriodo) {
      const dias = diasEntre(fechaDeHoy, proximoPeriodo);
      const yaAvisadoProximo =
        usuaria.notificacionPeriodoProximo?.getTime() === proximoPeriodo.getTime();
      const yaAvisadoHoy = usuaria.notificacionPeriodoHoy?.getTime() === proximoPeriodo.getTime();

      // <= (no ===): si el cron se saltea un día, igual llega al volver a
      // correr — el guard de "ya avisado para esta fecha" evita duplicados.
      if (dias >= 0 && dias <= DIAS_AVISO_PROXIMO && !yaAvisadoProximo) {
        await enviarNotificacionPush(usuaria.id, {
          titulo: "Tu período se acerca",
          cuerpo: `Se estima que empiece en ${dias === 0 ? "menos de un día" : `${dias} días`}.`,
          url: "/hoy",
        });
        cambios.notificacionPeriodoProximo = proximoPeriodo;
      }
      if (dias <= 0 && !yaAvisadoHoy) {
        await enviarNotificacionPush(usuaria.id, {
          titulo: "Hoy es la fecha estimada de tu período",
          cuerpo: "Según tu ciclo, hoy podría empezar tu período.",
          url: "/hoy",
        });
        cambios.notificacionPeriodoHoy = proximoPeriodo;
      }
    }

    if (Object.keys(cambios).length > 0) {
      await prisma.user.update({ where: { id: usuaria.id }, data: cambios });
    }
  }

  return NextResponse.json({ ok: true, usuarias: usuarias.length });
}
