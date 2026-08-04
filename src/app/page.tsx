import { existsSync } from "node:fs";
import path from "node:path";

import Image from "next/image";
import Link from "next/link";
// Clerk 7 sustituye <SignedIn>/<SignedOut> por <Show when="…">.
import { Show } from "@clerk/nextjs";

import { faseLunar } from "@/lib/moon";
import { BotonInstalarPwa } from "@/components/boton-instalar-pwa";

// Sin esto, Next.js pre-renderiza la landing una sola vez en el build (no
// depende de sesión ni de ninguna otra API dinámica) y congela `new Date()`
// en ese momento: la fase lunar mostrada dejaría de coincidir con la real a
// medida que pasan los días.
export const dynamic = "force-dynamic";

// La imagen de fondo es opcional: si no está en public/, el degradado
// "degradado-ola" ya cubre la sección sin dejar hueco ni error de carga.
const TIENE_IMAGEN_FONDO = existsSync(
  path.join(process.cwd(), "public", "intro.jpeg"),
);

export default function Landing() {
  // La landing es pública y no depende de ninguna sesión, así que la luna se
  // calcula para el hemisferio norte por defecto.
  const luna = faseLunar(new Date());

  return (
    <div className="flex flex-1 flex-col">
      <section className="degradado-ola relative flex flex-1 flex-col justify-end overflow-hidden text-espuma">
        {TIENE_IMAGEN_FONDO && (
          <Image
            src="/intro.jpeg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40"
          />
        )}

        <header className="absolute inset-x-0 top-0 z-10 mx-auto flex w-full max-w-3xl items-center gap-3 px-6 pt-6">
          <span className="font-serif text-lg font-semibold tracking-tight text-espuma">
            Maresa
          </span>
          <BotonInstalarPwa />
        </header>

        <div className="relative mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
          <p className="flex items-center gap-2 text-sm text-espuma/80">
            <span aria-hidden className="text-lg">
              {luna.emoji}
            </span>
            Hoy hay {luna.nombre.toLowerCase()}
          </p>

          <h1 className="mt-4 max-w-lg font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Tu ciclo y la luna, en el mismo calendario
          </h1>

          <p className="mt-4 max-w-md text-lg leading-relaxed text-espuma/80">
            Registra tus periodos y observa cómo tu ritmo se acompasa con
            las fases lunares. Privado, sin anuncios y sin vender tus datos.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Show when="signed-out">
              <Link
                href="/registrarse"
                className="rounded-full bg-espuma px-6 py-3 font-medium text-abismo transition-opacity hover:opacity-90"
              >
                Empezar
              </Link>
              <Link
                href="/entrar"
                className="rounded-full border border-espuma/40 px-6 py-3 font-medium transition-colors hover:bg-espuma/10"
              >
                Ya tengo cuenta
              </Link>
            </Show>
            <Show when="signed-in">
              <Link
                href="/hoy"
                className="rounded-full bg-espuma px-6 py-3 font-medium text-abismo transition-opacity hover:opacity-90"
              >
                Ir a mi ciclo
              </Link>
            </Show>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-3xl gap-6 px-6 py-12 sm:grid-cols-3">
        {[
          {
            titulo: "Predicción que aprende",
            texto:
              "Las estimaciones se recalculan con cada periodo que registras, dando más peso a los ciclos recientes.",
          },
          {
            titulo: "Fase lunar cada día",
            texto:
              "El calendario muestra la luna de cada jornada junto a tu fase del ciclo, para ver la relación entre ambas.",
          },
          {
            titulo: "Tus datos son tuyos",
            texto:
              "Solo tú accedes a tu registro. Nada se comparte con terceros ni se usa con fines publicitarios.",
          },
        ].map(({ titulo, texto }) => (
          <div key={titulo}>
            <h2 className="font-serif font-semibold">{titulo}</h2>
            <p className="mt-2 text-sm leading-relaxed text-tenue">{texto}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-borde px-6 py-6 text-center text-xs text-tenue">
        Maresa no es un producto sanitario. Las predicciones son orientativas y
        no sustituyen el criterio médico.
      </footer>
    </div>
  );
}
