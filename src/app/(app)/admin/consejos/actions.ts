"use server";

import { revalidatePath } from "next/cache";
import heicConvert from "heic-convert";

import { borrarConsejo, crearConsejo } from "@/lib/dal/consejos";
import {
  LIMITE_IMAGENES,
  contarImagenesSincronario,
  eliminarImagenSincronario,
  guardarImagenesSincronario,
} from "@/lib/dal/sincronario-imagen";
import type { FaseCicloConsejo, FaseLunarConsejo } from "@/generated/prisma/client";

export type EstadoFormularioConsejo = {
  error?: string;
  ok?: boolean;
};

export type EstadoImagenSincronario = {
  error?: string;
  ok?: boolean;
};

// Tope real de una función serverless de Vercel — ver next.config.ts.
const LIMITE_BYTES_IMAGEN = 4 * 1024 * 1024;
const TIPOS_FINALES_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

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

function esArchivoHeic(archivo: File): boolean {
  const nombre = archivo.name.toLowerCase();
  return (
    archivo.type === "image/heic" ||
    archivo.type === "image/heif" ||
    nombre.endsWith(".heic") ||
    nombre.endsWith(".heif")
  );
}

export async function accionSubirImagenSincronario(
  _estadoPrevio: EstadoImagenSincronario,
  formData: FormData,
): Promise<EstadoImagenSincronario> {
  const archivos = formData
    .getAll("archivo")
    .filter((valor): valor is File => valor instanceof File && valor.size > 0);

  if (archivos.length === 0) {
    return { error: "Elegí al menos una imagen." };
  }

  const disponibles = LIMITE_IMAGENES - (await contarImagenesSincronario());
  if (disponibles <= 0) {
    return { error: `Ya llegaste al máximo de ${LIMITE_IMAGENES} imágenes. Eliminá alguna para poder subir otra.` };
  }
  if (archivos.length > disponibles) {
    return {
      error: `Elegiste ${archivos.length} imágenes, pero solo hay lugar para ${disponibles} más (máximo ${LIMITE_IMAGENES}).`,
    };
  }

  // Se procesan (y validan) todas antes de guardar cualquiera: si una falla
  // a mitad de camino, no queda un lote a medio subir.
  const procesadas: { datos: Buffer; tipoMime: string }[] = [];

  for (const archivo of archivos) {
    if (archivo.size > LIMITE_BYTES_IMAGEN) {
      return { error: `"${archivo.name}" pesa demasiado (máximo 4 MB). Probá comprimirla y volver a subirla.` };
    }

    const bytesOriginales = Buffer.from(await archivo.arrayBuffer());
    let bytesFinales: Buffer = bytesOriginales;
    let tipoMime = archivo.type;

    if (esArchivoHeic(archivo)) {
      try {
        bytesFinales = await heicConvert({ buffer: bytesOriginales, format: "JPEG", quality: 0.85 });
        tipoMime = "image/jpeg";
      } catch {
        return {
          error: `No se pudo convertir "${archivo.name}" (HEIC/HEIF). Probá exportarla como JPG y subirla de nuevo.`,
        };
      }
    }

    if (!TIPOS_FINALES_PERMITIDOS.includes(tipoMime)) {
      return { error: `"${archivo.name}" tiene un formato no soportado. Usá JPG, PNG, WEBP o HEIC de iPhone.` };
    }

    procesadas.push({ datos: bytesFinales, tipoMime });
  }

  await guardarImagenesSincronario(procesadas);
  revalidar();
  return { ok: true };
}

export async function accionEliminarImagenSincronario(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || id === "") return;

  await eliminarImagenSincronario(id);
  revalidar();
}
