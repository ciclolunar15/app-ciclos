import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sin conexión",
};

export default function PaginaSinConexion() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <p aria-hidden className="text-4xl">
        🌑
      </p>
      <h1 className="font-serif text-xl font-semibold tracking-tight">
        No hay conexión
      </h1>
      <p className="max-w-xs text-sm text-tenue">
        Las páginas que ya has visitado siguen disponibles. Vuelve a intentarlo
        cuando recuperes la señal.
      </p>
    </div>
  );
}
