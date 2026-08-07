"use server";

import { redirect } from "next/navigation";

import { canjearCodigo } from "@/lib/dal/acceso";

export type EstadoCanjearCodigo = {
  error?: string;
};

export async function accionCanjearCodigo(
  _estadoPrevio: EstadoCanjearCodigo,
  formData: FormData,
): Promise<EstadoCanjearCodigo> {
  const codigo = formData.get("codigo");
  if (typeof codigo !== "string" || codigo.trim() === "") {
    return { error: "Ingresá el código que te pasó la administradora." };
  }

  const resultado = await canjearCodigo(codigo);
  if (!resultado.ok) {
    return {
      error:
        resultado.motivo === "bloqueada"
          ? "Superaste el máximo de intentos. Escribile a la administradora por WhatsApp para que te ayude."
          : "Código incorrecto o ya usado.",
    };
  }

  redirect("/hoy");
}
