import { Hemisphere, LunarPhase, Moon } from "lunarphase-js";

/**
 * Envoltorio sobre lunarphase-js con las etiquetas en español.
 *
 * Todos los cálculos son deterministas a partir de la fecha (día juliano),
 * sin red ni estado, así que pueden ejecutarse en Server Components.
 */

export type FaseLunar = {
  /** Nombre de la fase en español. */
  nombre: string;
  /** Emoji correspondiente, ya ajustado al hemisferio. */
  emoji: string;
  /** Días transcurridos desde la última luna nueva (0–29,53). */
  edad: number;
  /** Avance dentro del mes sinódico, de 0 a 1. */
  progreso: number;
  /** true si la luna está creciendo. */
  creciente: boolean;
  /** Identificador estable de la fase, útil para estilos y comparaciones. */
  clave: ClaveFaseLunar;
};

export type ClaveFaseLunar =
  | "nueva"
  | "creciente-visible"
  | "cuarto-creciente"
  | "gibosa-creciente"
  | "llena"
  | "gibosa-menguante"
  | "cuarto-menguante"
  | "menguante-visible";

const FASES: Record<LunarPhase, { clave: ClaveFaseLunar; nombre: string }> = {
  [LunarPhase.NEW]: { clave: "nueva", nombre: "Luna nueva" },
  [LunarPhase.WAXING_CRESCENT]: {
    clave: "creciente-visible",
    nombre: "Creciente visible",
  },
  [LunarPhase.FIRST_QUARTER]: {
    clave: "cuarto-creciente",
    nombre: "Cuarto creciente",
  },
  [LunarPhase.WAXING_GIBBOUS]: {
    clave: "gibosa-creciente",
    nombre: "Gibosa creciente",
  },
  [LunarPhase.FULL]: { clave: "llena", nombre: "Luna llena" },
  [LunarPhase.WANING_GIBBOUS]: {
    clave: "gibosa-menguante",
    nombre: "Gibosa menguante",
  },
  [LunarPhase.LAST_QUARTER]: {
    clave: "cuarto-menguante",
    nombre: "Cuarto menguante",
  },
  [LunarPhase.WANING_CRESCENT]: {
    clave: "menguante-visible",
    nombre: "Menguante visible",
  },
};

/** Duración del mes sinódico en días. */
export const MES_SINODICO = 29.53059;

export function faseLunar(
  fecha: Date,
  hemisferio: Hemisphere = Hemisphere.NORTHERN,
): FaseLunar {
  const fase = Moon.lunarPhase(fecha, { hemisphere: hemisferio });
  const { clave, nombre } = FASES[fase];

  return {
    nombre,
    clave,
    emoji: Moon.lunarPhaseEmoji(fecha, { hemisphere: hemisferio }),
    edad: Moon.lunarAge(fecha),
    progreso: Moon.lunarAgePercent(fecha),
    creciente: Moon.isWaxing(fecha),
  };
}

/** Convierte el valor guardado en la base de datos al enum de la librería. */
export function aHemisferio(valor: "NORTHERN" | "SOUTHERN"): Hemisphere {
  return valor === "SOUTHERN" ? Hemisphere.SOUTHERN : Hemisphere.NORTHERN;
}

export { Hemisphere };
