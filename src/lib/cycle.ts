import { PredictionEngine, type AnalyticsSummary } from "cyclia";

/**
 * Adaptador sobre `cyclia`. Toda la app habla con este módulo y nunca con la
 * librería directamente, de modo que cambiar de motor de predicción sea tocar
 * un solo archivo.
 *
 * Aquí también se corrigen dos comportamientos de cyclia comprobados a mano:
 *  1. `predictFertileWindow` devuelve "1970-01-01" (epoch) en lugar de null
 *     cuando no hay datos suficientes.
 *  2. `confidence` es muy conservadora — 0,48 con seis ciclos perfectamente
 *     regulares. Mostrarla como porcentaje alarmaría sin motivo, así que se
 *     traduce a un nivel cualitativo.
 *
 * Convenio de fechas: los ciclos son *fechas civiles*, sin hora. Prisma las
 * devuelve como Date a medianoche UTC y aquí se manipulan siempre con
 * accesores UTC, así que ningún cambio de huso ni de horario de verano puede
 * desplazar un día.
 */

/** Ciclo tal y como lo devuelve la base de datos. */
export type CicloRegistrado = {
  id: string;
  startDate: Date;
  endDate: Date | null;
};

export type FaseCiclo = "menstrual" | "folicular" | "ovulatoria" | "lutea";

export type Fiabilidad = "insuficiente" | "baja" | "media" | "alta";

export type Rango = { inicio: Date; fin: Date };

export type Prediccion = {
  /** Fecha más probable del próximo sangrado; null si no hay datos. */
  proximoPeriodo: Date | null;
  /** Margen razonable alrededor de esa fecha. */
  ventanaProximoPeriodo: Rango | null;
  ovulacion: Date | null;
  ventanaFertil: Rango | null;
  fiabilidad: Fiabilidad;
};

export type ResumenCiclos = {
  /** Número de intervalos medidos: con 3 periodos registrados hay 2 intervalos. */
  intervalos: number;
  duraciones: number[];
  duracionMedia: number | null;
  duracionMediana: number | null;
  desviacion: number | null;
  irregular: boolean;
};

export type EstadoActual = {
  /** Día del ciclo, empezando en 1 el primer día de sangrado. */
  diaDelCiclo: number | null;
  fase: FaseCiclo | null;
  ultimoInicio: Date | null;
  diasHastaProximoPeriodo: number | null;
};

/** Duración de ciclo que se asume mientras no haya historial suficiente. */
export const DURACION_CICLO_POR_DEFECTO = 28;
/** Días de sangrado que se asumen para delimitar la fase menstrual. */
export const DIAS_SANGRADO_POR_DEFECTO = 5;
/** Duración de la fase lútea, constante entre personas mucho más que la folicular. */
export const DIAS_FASE_LUTEA = 14;

const motor = new PredictionEngine({
  strategy: "wma",
  lutealPhaseDays: DIAS_FASE_LUTEA,
});

// --- Fechas civiles -------------------------------------------------------

/** Date (medianoche UTC) → "YYYY-MM-DD". */
export function aISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" → Date a medianoche UTC. */
export function desdeISO(iso: string): Date {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

/** Hoy como fecha civil a medianoche UTC, según el huso indicado. */
export function hoy(zonaHoraria = "Europe/Madrid"): Date {
  // en-CA formatea como YYYY-MM-DD, que es justo el formato que necesitamos.
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: zonaHoraria,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return desdeISO(iso);
}

const MS_POR_DIA = 86_400_000;

/** Días naturales entre dos fechas civiles. */
export function diasEntre(desde: Date, hasta: Date): number {
  return Math.round((hasta.getTime() - desde.getTime()) / MS_POR_DIA);
}

export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() + dias * MS_POR_DIA);
}

export function mismaFecha(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

// --- Puente con cyclia ----------------------------------------------------

function historial(ciclos: CicloRegistrado[]) {
  return {
    periodStarts: ciclos.map((c) => ({ date: aISO(c.startDate) })),
  };
}

/** Rechaza las fechas centinela (epoch) que cyclia devuelve sin datos. */
function fechaValida(iso: string | null | undefined): Date | null {
  if (!iso || iso === "1970-01-01") return null;
  return desdeISO(iso);
}

function nivelFiabilidad(
  confianza: number,
  calidad: AnalyticsSummary["dataQuality"],
  intervalos: number,
): Fiabilidad {
  if (intervalos < 1) return "insuficiente";
  if (calidad === "high" || confianza >= 0.45) return "alta";
  if (calidad === "medium" || confianza >= 0.2) return "media";
  return "baja";
}

// --- API pública ----------------------------------------------------------

export function resumenCiclos(ciclos: CicloRegistrado[]): ResumenCiclos {
  const s = motor.analyze(historial(ciclos));
  return {
    intervalos: s.sampleSize,
    duraciones: s.cycleIntervals,
    duracionMedia: s.averageCycle,
    duracionMediana: s.medianCycle,
    desviacion: s.stdCycle,
    irregular: s.irregular,
  };
}

export function predecir(ciclos: CicloRegistrado[]): Prediccion {
  const h = historial(ciclos);
  const resumen = motor.analyze(h);
  const siguiente = motor.predictNextPeriod(h);
  const proximoPeriodo = fechaValida(siguiente.likely);

  // Sin próxima menstruación estimada no hay nada más que calcular: es la
  // entrada de la que dependen ovulación y ventana fértil.
  if (!proximoPeriodo) {
    return {
      proximoPeriodo: null,
      ventanaProximoPeriodo: null,
      ovulacion: null,
      ventanaFertil: null,
      fiabilidad: "insuficiente",
    };
  }

  const ovulacionCruda = motor.predictOvulation(h);
  const fertilCruda = motor.predictFertileWindow(h);
  const inicioFertil = fechaValida(fertilCruda.start);
  const finFertil = fechaValida(fertilCruda.end);

  return {
    proximoPeriodo,
    ventanaProximoPeriodo: siguiente.window
      ? {
          inicio: desdeISO(siguiente.window.start),
          fin: desdeISO(siguiente.window.end),
        }
      : null,
    ovulacion: fechaValida(ovulacionCruda.likely),
    ventanaFertil:
      inicioFertil && finFertil
        ? { inicio: inicioFertil, fin: finFertil }
        : null,
    fiabilidad: nivelFiabilidad(
      siguiente.confidence,
      resumen.dataQuality,
      resumen.sampleSize,
    ),
  };
}

/**
 * Fase del ciclo para un día concreto.
 *
 * La fase lútea dura ~14 días de forma bastante estable, así que la ovulación
 * se sitúa restando esos días a la duración total y es la fase folicular la
 * que absorbe la variabilidad entre personas.
 */
export function faseDelCiclo(
  diaDelCiclo: number,
  duracionCiclo = DURACION_CICLO_POR_DEFECTO,
  diasSangrado = DIAS_SANGRADO_POR_DEFECTO,
): FaseCiclo {
  const diaOvulacion = Math.max(diasSangrado + 3, duracionCiclo - DIAS_FASE_LUTEA);

  if (diaDelCiclo <= diasSangrado) return "menstrual";
  if (diaDelCiclo < diaOvulacion - 2) return "folicular";
  if (diaDelCiclo <= diaOvulacion + 2) return "ovulatoria";
  return "lutea";
}

export function estadoActual(
  ciclos: CicloRegistrado[],
  fechaDeHoy: Date,
): EstadoActual {
  const ultimo = ultimoCiclo(ciclos);
  if (!ultimo) {
    return {
      diaDelCiclo: null,
      fase: null,
      ultimoInicio: null,
      diasHastaProximoPeriodo: null,
    };
  }

  const transcurridos = diasEntre(ultimo.startDate, fechaDeHoy);
  // Un inicio de periodo anotado en el futuro no debe producir un día 0 o negativo.
  const diaDelCiclo = transcurridos >= 0 ? transcurridos + 1 : null;

  const resumen = resumenCiclos(ciclos);
  const duracion = resumen.duracionMedia ?? DURACION_CICLO_POR_DEFECTO;
  const diasSangrado = duracionUltimoSangrado(ultimo) ?? DIAS_SANGRADO_POR_DEFECTO;

  const proximo = predecir(ciclos).proximoPeriodo;

  return {
    diaDelCiclo,
    fase: diaDelCiclo ? faseDelCiclo(diaDelCiclo, duracion, diasSangrado) : null,
    ultimoInicio: ultimo.startDate,
    diasHastaProximoPeriodo: proximo ? diasEntre(fechaDeHoy, proximo) : null,
  };
}

/** El ciclo con el inicio más reciente. No asume que la lista venga ordenada. */
export function ultimoCiclo(
  ciclos: CicloRegistrado[],
): CicloRegistrado | null {
  if (ciclos.length === 0) return null;
  return ciclos.reduce((a, b) =>
    b.startDate.getTime() > a.startDate.getTime() ? b : a,
  );
}

/** Duración del sangrado en días, contando ambos extremos. */
export function duracionUltimoSangrado(ciclo: CicloRegistrado): number | null {
  if (!ciclo.endDate) return null;
  return diasEntre(ciclo.startDate, ciclo.endDate) + 1;
}

export const ETIQUETAS_FASE: Record<FaseCiclo, string> = {
  menstrual: "Menstrual",
  folicular: "Folicular",
  ovulatoria: "Ovulatoria",
  lutea: "Lútea",
};

export const ETIQUETAS_FIABILIDAD: Record<Fiabilidad, string> = {
  insuficiente: "Sin datos suficientes",
  baja: "Fiabilidad baja",
  media: "Fiabilidad media",
  alta: "Fiabilidad alta",
};
