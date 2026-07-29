import type { FaseCiclo } from "@/lib/cycle";

/** Clases fijas y no interpoladas: Tailwind necesita ver el nombre completo. */
const COLOR: Record<FaseCiclo, string> = {
  menstrual: "bg-fase-menstrual",
  folicular: "bg-fase-folicular",
  ovulatoria: "bg-fase-ovulatoria",
  lutea: "bg-fase-lutea",
};

export function PuntoFase({ fase }: { fase: FaseCiclo }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-3 shrink-0 rounded-full ${COLOR[fase]}`}
    />
  );
}

export { COLOR as COLOR_FASE };
