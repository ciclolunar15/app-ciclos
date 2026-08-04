import Image from "next/image";
import Link from "next/link";

import { BotonInstalarPwa } from "@/components/boton-instalar-pwa";

export default function LayoutAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-marea px-4 py-12">
      {/*
        "Maresa" se fija a una distancia constante de la parte superior del
        viewport, en vez de vivir en el mismo flujo centrado que la tarjeta.
        La tarjeta de Clerk cambia de altura según la pantalla (entrar vs.
        registrarse trae un campo más), lo que desplaza el conjunto
        marco+tarjeta verticalmente entre una página y otra. Si "Maresa"
        dependiera de esa misma altura, el ajuste que lo separa del sol del
        marco en una pantalla lo solapa en la otra.
      */}
      <div className="absolute top-6 left-1/2 flex -translate-x-1/2 items-center gap-3">
        <Link
          href="/"
          className="font-serif text-lg font-semibold tracking-tight text-espuma transition-opacity hover:opacity-80"
        >
          Maresa
        </Link>
        <BotonInstalarPwa />
      </div>

      <div className="relative flex items-center justify-center">
        {/* marco.png es casi todo transparente: solo el trazado dorado es
            opaco. Se pinta detrás de la tarjeta de Clerk para enmarcarla.
            En móvil el marco cuadrado no cabe (necesita aire lateral que no
            sobra junto a una tarjeta casi a ancho completo), así que se
            reserva para "sm" en adelante; debajo se usan las franjas
            recortadas de abajo. */}
        <Image
          src="/marco.png"
          alt=""
          width={1024}
          height={1024}
          priority
          aria-hidden
          sizes="min(94vw, 720px)"
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 hidden aspect-square w-[min(94vw,720px)] max-w-none -translate-x-1/2 -translate-y-1/2 select-none sm:block"
        />
        <div className="relative z-10">
          {/* Recortes de la franja superior/inferior de marco.png (sol+lunas
              arriba, triple luna abajo), solo por debajo de "sm". Se anclan
              a los bordes de esta misma tarjeta (bottom-full / top-full) en
              vez de a una altura fija de viewport, así siguen el borde real
              de la tarjeta sin importar si es la de /entrar o /registrarse. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-full aspect-[1024/200] sm:hidden">
            <Image
              src="/marco-superior.png"
              alt=""
              fill
              aria-hidden
              sizes="94vw"
              className="select-none object-contain"
            />
          </div>
          {children}
          <div className="pointer-events-none absolute inset-x-0 top-full aspect-[1024/200] sm:hidden">
            <Image
              src="/marco-inferior.png"
              alt=""
              fill
              aria-hidden
              sizes="94vw"
              className="select-none object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
