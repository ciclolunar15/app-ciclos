"use server";

import { revalidatePath } from "next/cache";

import {
  actualizarCiclo,
  borrarCiclo,
  crearCiclo,
  existeCicloEnFecha,
} from "@/lib/dal/cycles";
import { desdeISO, diasEntre, hoy } from "@/lib/cycle";

export type EstadoFormulario = {
  error?: string;
  ok?: boolean;
};

/** Máximo de días de sangrado que se aceptan como plausibles. */
const MAX_DIAS_SANGRADO = 15;

function leerFecha(valor: FormDataEntryValue | null): Date | null {
  if (typeof valor !== "string" || valor.trim() === "") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;

  const fecha = desdeISO(valor);
  // Descarta fechas imposibles como 2026-02-31, que Date normalizaría en
  // silencio al 3 de marzo.
  return Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor
    ? null
    : fecha;
}

/** Validación compartida por alta y edición. */
async function validar(
  formData: FormData,
  excluyendoId?: string,
): Promise<
  { error: string } | { datos: { startDate: Date; endDate: Date | null; notes: string | null } }
> {
  const startDate = leerFecha(formData.get("startDate"));
  if (!startDate) {
    return { error: "Indica la fecha del primer día de sangrado." };
  }

  const hoyFecha = hoy();
  if (startDate.getTime() > hoyFecha.getTime()) {
    return { error: "La fecha de inicio no puede estar en el futuro." };
  }

  const endDate = leerFecha(formData.get("endDate"));
  if (endDate) {
    if (endDate.getTime() < startDate.getTime()) {
      return { error: "El último día no puede ser anterior al primero." };
    }
    if (endDate.getTime() > hoyFecha.getTime()) {
      return { error: "El último día no puede estar en el futuro." };
    }
    if (diasEntre(startDate, endDate) + 1 > MAX_DIAS_SANGRADO) {
      return {
        error: `Un sangrado de más de ${MAX_DIAS_SANGRADO} días es poco habitual. Revisa las fechas.`,
      };
    }
  }

  if (await existeCicloEnFecha(startDate, excluyendoId)) {
    return { error: "Ya tienes un periodo registrado que empieza ese día." };
  }

  const notasCrudas = formData.get("notes");
  const notes =
    typeof notasCrudas === "string" && notasCrudas.trim() !== ""
      ? notasCrudas.trim().slice(0, 500)
      : null;

  return { datos: { startDate, endDate, notes } };
}

function revalidar() {
  revalidatePath("/hoy");
  revalidatePath("/calendario");
  revalidatePath("/registro");
}

export async function accionCrearCiclo(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const resultado = await validar(formData);
  if ("error" in resultado) return resultado;

  await crearCiclo(resultado.datos);
  revalidar();

  return { ok: true };
}

export async function accionActualizarCiclo(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") {
    return { error: "No se ha indicado qué periodo editar." };
  }

  const resultado = await validar(formData, id);
  if ("error" in resultado) return resultado;

  const actualizado = await actualizarCiclo(id, resultado.datos);
  if (!actualizado) {
    return { error: "No se ha encontrado ese periodo." };
  }

  revalidar();
  return { ok: true };
}

export async function accionBorrarCiclo(
  formData: FormData,
): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") return;

  await borrarCiclo(id);
  revalidar();
}
