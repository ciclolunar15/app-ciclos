/**
 * Formateo de fechas en español.
 *
 * Las fechas de ciclo son fechas civiles guardadas a medianoche UTC, así que
 * todos los formateadores fijan `timeZone: "UTC"`. Sin eso, en cualquier huso
 * al oeste de Greenwich un periodo del día 3 se mostraría como día 2.
 */

const ZONA = "UTC";

export const fechaLarga = new Intl.DateTimeFormat("es-ES", {
  timeZone: ZONA,
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const fechaCorta = new Intl.DateTimeFormat("es-ES", {
  timeZone: ZONA,
  day: "numeric",
  month: "short",
});

export const fechaConDiaSemana = new Intl.DateTimeFormat("es-ES", {
  timeZone: ZONA,
  weekday: "long",
  day: "numeric",
  month: "long",
});

export const mesYAnio = new Intl.DateTimeFormat("es-ES", {
  timeZone: ZONA,
  month: "long",
  year: "numeric",
});

/** "YYYY-MM-DD", el formato que espera un <input type="date">. */
export function paraInput(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/** Abreviaturas de mes fijas: controla exactamente el texto ("ene", no
 * "ene." ni "Ene"), sin depender de cómo cada motor de ICU formatee "short". */
export const MESES_ABREV = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

export function mesAbreviado(fecha: Date): string {
  return MESES_ABREV[fecha.getUTCMonth()];
}

export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "faltan 5 días", "es hoy", "hace 3 días". */
export function enDias(dias: number): string {
  if (dias === 0) return "hoy";
  if (dias === 1) return "mañana";
  if (dias === -1) return "ayer";
  if (dias > 0) return `en ${dias} días`;
  return `hace ${Math.abs(dias)} días`;
}

const RELATIVO = new Intl.RelativeTimeFormat("es", { numeric: "auto", style: "short" });
/** Fecha de respaldo para publicaciones de más de un mes: acá sí importa la
 * hora real (no es una fecha civil como las de ciclo), así que no se fuerza
 * UTC — usa el huso del entorno donde corre. */
const FECHA_HORA = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });

/** "ahora", "hace 5 min", "hace 2 h", "hace 3 d"... para publicaciones del foro. */
export function haceTiempo(fecha: Date): string {
  const segundos = Math.round((fecha.getTime() - Date.now()) / 1000);
  if (Math.abs(segundos) < 60) return "ahora";

  const minutos = Math.round(segundos / 60);
  if (Math.abs(minutos) < 60) return RELATIVO.format(minutos, "minute");

  const horas = Math.round(minutos / 60);
  if (Math.abs(horas) < 24) return RELATIVO.format(horas, "hour");

  const dias = Math.round(horas / 24);
  if (Math.abs(dias) < 30) return RELATIVO.format(dias, "day");

  return FECHA_HORA.format(fecha);
}
