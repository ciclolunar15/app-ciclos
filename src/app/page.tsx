import { existsSync } from "node:fs";
import path from "node:path";

import Image from "next/image";
import Link from "next/link";
// Clerk 7 sustituye <SignedIn>/<SignedOut> por <Show when="…">.
import { Show } from "@clerk/nextjs";

import { BannerInstalarPwa } from "@/components/banner-instalar-pwa";
import { BurbujaIntro } from "@/components/burbuja-intro";

// La imagen de fondo es opcional: si no está en public/, el degradado
// "degradado-ola" ya cubre la sección sin dejar hueco ni error de carga.
const TIENE_IMAGEN_FONDO = existsSync(
  path.join(process.cwd(), "public", "intro.jpeg"),
);

export default function Landing() {
  return (
    <div className="flex flex-1 flex-col">
      <BannerInstalarPwa />

      <section className="degradado-ola relative overflow-hidden text-espuma">
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

        <div className="relative mx-auto w-full max-w-3xl px-6 pb-16 pt-16 sm:pt-20">
          
          <h1 className="mt-6 text-center font-tangerine text-6xl font-bold tracking-tight text-espuma sm:text-7xl">
            Maresa
          </h1>

          <div className="mt-10">
            <BurbujaIntro lado="izquierda">
              <p className="font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                AMARSE (Maresa)
              </p>

              <div className="mt-4 space-y-4 text-base leading-relaxed text-espuma/90">
                <p>
                  ¡Hola! Soy Mar, Mujer Canal y Medicina. Creadora de éste
                  espacio exclusivamente para vos y tu salud menstrual y
                  Uterina. ¿Sabías que nuestro cuerpo se desequilibra y
                  enferma cuando nos desconectamos de él? Ésta App te guiará
                  para volver a tu centro, a saber dónde estás y hacia dónde
                  ir. Pero sobre todo, a sentir y habitar tus cuerpos con
                  Amor, honrando tu ciclo y tu naturaleza.
                </p>

                <p>
                  AMARSE (Maresa) es el primer y gran paso hacia una vida
                  saludable y en coherencia con tu Útero, tu valor, Poder,
                  Creatividad y Merecimiento.
                </p>

                <p className="font-serif text-xl italic text-luna">
                  ¿Estás lista para amarte?
                </p>
              </div>
            </BurbujaIntro>
          </div>

          <div className="mt-16 sm:mt-24">
            <BurbujaIntro lado="derecha">
              <p className="font-serif text-lg font-semibold text-luna">
                ¿Y de qué se trata todo esto?
              </p>

              <div className="mt-4 space-y-4 text-base leading-relaxed text-espuma/90">
                <p>
                  Aquí encontrarás un sincronario lunar y menstrual donde
                  conectás las lunas con tu ciclo. Aunque al comienzo sientas
                  que no estás en sincronía, es un proceso que con el tiempo
                  vas a poder ver y sentir cómo todo entra en coherencia y
                  armonía. Un Foro &quot;La Tribu&quot; donde podés
                  consultar y sacarte dudas, charlar con otros seres
                  menstruantes. Además vas a tener cada día tips (posturas
                  de yoga, rituales, recetas, ideas, etc.), consejitos y
                  recomendaciones para transitar cada etapa con más AutoAmor
                  y Calma. Habitando el cuerpo y conectándote con tu centro,
                  donde están todas las respuestas. No olvides que el camino
                  siempre es hacia adentro 🌀.
                </p>

                <p>
                  Si resonás con esta magia, para acceder a la app das{" "}
                  <strong className="font-semibold text-luna">$8.000</strong>{" "}
                  en retribución a tanto Amor entregado, que te será
                  devuelto 🪄
                </p>
              </div>
            </BurbujaIntro>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-3 px-6 sm:px-0">
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

      <footer className="border-t border-borde px-6 py-6 text-center text-xs text-tenue">
        Maresa no es un producto sanitario. Las predicciones son orientativas y
        no sustituyen el criterio médico.
      </footer>
    </div>
  );
}
