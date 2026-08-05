"use server";

import { revalidatePath } from "next/cache";

import { borrarPost, crearPost } from "@/lib/dal/foro";

export type EstadoFormularioPost = {
  error?: string;
  ok?: boolean;
};

export async function accionCrearPost(
  _estadoPrevio: EstadoFormularioPost,
  formData: FormData,
): Promise<EstadoFormularioPost> {
  const contenido = formData.get("contenido");
  const esAnonimo = formData.get("esAnonimo") === "on";
  const respuestaAIdCrudo = formData.get("respuestaAId");
  const respuestaAId =
    typeof respuestaAIdCrudo === "string" && respuestaAIdCrudo !== "" ? respuestaAIdCrudo : null;

  if (typeof contenido !== "string" || contenido.trim() === "") {
    return { error: "Escribí algo antes de publicar." };
  }
  if (contenido.trim().length > 2000) {
    return { error: "El post es demasiado largo (máximo 2000 caracteres)." };
  }

  try {
    await crearPost({ contenido: contenido.trim(), esAnonimo, respuestaAId });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo publicar." };
  }

  revalidatePath("/foro");
  return { ok: true };
}

export async function accionBorrarPost(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") return;

  await borrarPost(id);
  revalidatePath("/foro");
}
