import { diasEntre, sumarDias } from "@/lib/cycle";

/**
 * Sincronario de 13 Lunas (calendario Dreamspell de José y Lloydine Argüelles).
 *
 * Esto es contenido simbólico/espiritual, igual que la fase lunar: se calcula
 * de forma determinista a partir de la fecha (sin red ni estado) pero no
 * tiene ninguna relación causal con el ciclo ni las hormonas. Nunca debe
 * mezclarse con `lib/cycle.ts`, que es la lógica médica/evidence-based.
 *
 * Referencias del cálculo (verificadas, no inventadas):
 *  - Época: 26 de julio de 1987 = Kin 1 (Dragón Rojo Magnético). El Tzolkin
 *    (los 260 Kin) es un conteo continuo, independiente de años o lunas.
 *  - El año de 13 lunas va del 26 de julio al 24 de julio siguiente
 *    (13 lunas × 28 días = 364), y el 25 de julio es el "Día Fuera del
 *    Tiempo": no pertenece a ninguna luna.
 *  - En años bisiestos se añade el 29 de febrero como "Hunab Ku", un día
 *    intercalar que tampoco cuenta dentro de ninguna luna (para que el resto
 *    del año de 13 lunas no se desplace). Cae siempre dentro de la Luna
 *    Galáctica (la 8ª), entre sus días 22 y 23.
 */

export const SELLOS = [
  "Dragón",
  "Viento",
  "Noche",
  "Semilla",
  "Serpiente",
  "Enlazador de Mundos",
  "Mano",
  "Estrella",
  "Luna",
  "Perro",
  "Mono",
  "Humano",
  "Caminante del Cielo",
  "Mago",
  "Águila",
  "Guerrero",
  "Tierra",
  "Espejo",
  "Tormenta",
  "Sol",
] as const;

/** Color del sello, cíclico de 4 en 4 (índice de sello, base 0, mod 4). */
export const COLOR_SELLO = ["Rojo", "Blanco", "Azul", "Amarillo"] as const;

/**
 * Los 13 tonos galácticos del Tzolkin llevan los mismos nombres que las 13
 * lunas del año: el sistema reutiliza a propósito una única secuencia de 13
 * cualidades para ambos.
 */
export const TONOS = [
  "Magnética",
  "Lunar",
  "Eléctrica",
  "Autoexistente",
  "Entonada",
  "Rítmica",
  "Resonante",
  "Galáctica",
  "Solar",
  "Planetaria",
  "Espectral",
  "Cristal",
  "Cósmica",
] as const;

export const LUNAS = TONOS;

export type ResultadoSincronario =
  | {
      tipo: "normal";
      kin: number;
      sello: number;
      tono: number;
      luna: number;
      diaEnLuna: number;
    }
  | { tipo: "hunab-ku"; kin: number; sello: number; tono: number }
  | { tipo: "fuera-del-tiempo"; kin: number; sello: number; tono: number };

const EPOCA_KIN_1 = new Date(Date.UTC(1987, 6, 26));

function modulo(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function esBisiesto(anio: number): boolean {
  return (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
}

export function kinDe(fecha: Date): number {
  return modulo(diasEntre(EPOCA_KIN_1, fecha), 260) + 1;
}

export function selloDe(kin: number): number {
  return modulo(kin - 1, 20) + 1;
}

export function tonoDe(kin: number): number {
  return modulo(kin - 1, 13) + 1;
}

/** El 26 de julio que abre el año de 13 lunas al que pertenece `fecha`. */
export function inicioAnioLunar(fecha: Date): Date {
  const julio26 = new Date(Date.UTC(fecha.getUTCFullYear(), 6, 26));
  return fecha.getTime() >= julio26.getTime()
    ? julio26
    : new Date(Date.UTC(fecha.getUTCFullYear() - 1, 6, 26));
}

export function calcularSincronario(fecha: Date): ResultadoSincronario {
  const kin = kinDe(fecha);
  const sello = selloDe(kin);
  const tono = tonoDe(kin);

  if (fecha.getUTCMonth() === 6 && fecha.getUTCDate() === 25) {
    return { tipo: "fuera-del-tiempo", kin, sello, tono };
  }
  if (fecha.getUTCMonth() === 1 && fecha.getUTCDate() === 29) {
    return { tipo: "hunab-ku", kin, sello, tono };
  }

  const inicio = inicioAnioLunar(fecha);
  let indice = diasEntre(inicio, fecha);

  // Si este año de 13 lunas ya tuvo su Hunab Ku (29 de febrero) antes de esta
  // fecha, ese día no cuenta: el resto del año se corre un puesto.
  const anioSiguiente = inicio.getUTCFullYear() + 1;
  if (esBisiesto(anioSiguiente)) {
    const hunabKu = new Date(Date.UTC(anioSiguiente, 1, 29));
    if (fecha.getTime() > hunabKu.getTime()) indice -= 1;
  }

  return {
    tipo: "normal",
    kin,
    sello,
    tono,
    luna: Math.floor(indice / 28) + 1,
    diaEnLuna: (indice % 28) + 1,
  };
}

export type CeldaSincronario =
  | {
      tipo: "normal";
      fecha: Date;
      diaEnLuna: number;
      kin: number;
      sello: number;
      tono: number;
    }
  | { tipo: "hunab-ku"; fecha: Date; kin: number; sello: number; tono: number };

/** Los días de una luna (1-13) del año de 13 lunas que empieza en `inicio`. */
export function diasDeLuna(inicio: Date, luna: number): CeldaSincronario[] {
  const celdas: CeldaSincronario[] = [];
  for (let i = 0; i < 400; i++) {
    const fecha = sumarDias(inicio, i);
    const r = calcularSincronario(fecha);

    if (r.tipo === "normal") {
      if (r.luna > luna) break;
      if (r.luna === luna) {
        celdas.push({
          tipo: "normal",
          fecha,
          diaEnLuna: r.diaEnLuna,
          kin: r.kin,
          sello: r.sello,
          tono: r.tono,
        });
      }
    } else if (r.tipo === "hunab-ku" && celdas.length > 0) {
      celdas.push({ tipo: "hunab-ku", fecha, kin: r.kin, sello: r.sello, tono: r.tono });
    }
  }
  return celdas;
}

/** La fecha del Día Fuera del Tiempo del año de 13 lunas que empieza en `inicio`. */
export function fueraDelTiempoDe(inicio: Date): Date {
  return new Date(Date.UTC(inicio.getUTCFullYear() + 1, 6, 25));
}
