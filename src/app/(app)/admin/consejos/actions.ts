"use server";

import { revalidatePath } from "next/cache";

import { borrarConsejo, crearConsejo } from "@/lib/dal/consejos";
import type { FaseCicloConsejo, FaseLunarConsejo } from "@/generated/prisma/client";

export type EstadoFormularioConsejo = {
  error?: string;
  ok?: boolean;
};

const FASES_CICLO: FaseCicloConsejo[] = [
  "MENSTRUAL",
  "PRE_OVULACION",
  "OVULACION",
  "PRE_MENSTRUAL",
];
const FASES_LUNAR: FaseLunarConsejo[] = ["NUEVA", "CRECIENTE", "LLENA", "MENGUANTE"];

function revalidar() {
  revalidatePath("/hoy");
  revalidatePath("/calendario");
  revalidatePath("/admin/consejos");
}

export async function accionCrearConsejo(
  _estadoPrevio: EstadoFormularioConsejo,
  formData: FormData,
): Promise<EstadoFormularioConsejo> {
  const faseCiclo = formData.get("faseCiclo");
  const faseLunar = formData.get("faseLunar");
  const texto = formData.get("texto");

  if (
    typeof faseCiclo !== "string" ||
    !FASES_CICLO.includes(faseCiclo as FaseCicloConsejo)
  ) {
    return { error: "Elegí una fase del ciclo válida." };
  }
  if (
    typeof faseLunar !== "string" ||
    !FASES_LUNAR.includes(faseLunar as FaseLunarConsejo)
  ) {
    return { error: "Elegí una fase lunar válida." };
  }
  if (typeof texto !== "string" || texto.trim() === "") {
    return { error: "Escribí el texto del consejo." };
  }
  if (texto.trim().length > 1000) {
    return { error: "El texto es demasiado largo (máximo 1000 caracteres)." };
  }

  await crearConsejo({
    faseCiclo: faseCiclo as FaseCicloConsejo,
    faseLunar: faseLunar as FaseLunarConsejo,
    texto: texto.trim(),
  });

  revalidar();
  return { ok: true };
}

export async function accionBorrarConsejo(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") return;

  await borrarConsejo(id);
  revalidar();
}
