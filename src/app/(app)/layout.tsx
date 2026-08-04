import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";

import { NavPrincipal } from "@/components/nav-principal";
import { SincronizadorZonaHoraria } from "@/components/sincronizador-zona-horaria";
import { BotonInstalarPwa } from "@/components/boton-instalar-pwa";
import { perfilActual } from "@/lib/dal/cycles";

export default async function LayoutApp({
  children,
}: {
  children: React.ReactNode;
}) {
  // Comprobación junto al recurso, no por patrón de ruta: quien no tenga
  // sesión es redirigido a la pantalla de acceso. El DAL vuelve a verificarlo
  // en cada consulta, porque un layout no protege un Server Function
  // invocado por POST directo.
  await auth.protect();

  const perfil = await perfilActual();
  // Esto solo decide si se muestra el ítem "Admin" en la barra de navegación:
  // es una comodidad de UI, no el límite de seguridad. Ese límite real es
  // requerirAdmin() dentro de lib/dal/consejos.ts, que se vuelve a comprobar
  // en cada acción/consulta admin, igual que el resto del DAL.
  const usuario = await currentUser();
  const esAdmin = usuario?.publicMetadata?.role === "admin";

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Sol celestial de fondo. Mobile y desktop usan mecanismos distintos
          a propósito, no solo valores distintos:
          - Mobile (sin prefijo): el div ocupa toda la pantalla y el fondo
            mide el doble de ancho (200%). Con "right", el centro de la
            imagen cae matemáticamente justo en x=0 — la pared izquierda
            corta al sol exactamente a la mitad. Verificado con capturas de
            píxeles reales, no es un valor a ojo.
          - Desktop ("sm:" en adelante): el div pasa a ser solo la mitad
            izquierda de la pantalla (se pisa el inset-0 de mobile), y el
            sol —completo, sin recorte— queda centrado ahí adentro, o sea
            en el centro-izquierda de toda la pantalla. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[url('/sol_celestial.png')] bg-[length:200%_auto] bg-[position:-500px_center] bg-no-repeat opacity-50 sm:inset-y-0 sm:left-0 sm:right-auto sm:w-1/2 sm:bg-[length:70%_auto] sm:bg-center"
      />
      {/* Luna celestial: mismo criterio espejado (mitad derecha en mobile
          cortada por esa pared; mitad derecha de la pantalla, centrada y
          completa, en desktop). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[url('/luna_celestial.png')] bg-[length:200%_auto] bg-[position:130px_center] bg-no-repeat opacity-50 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-1/2 sm:bg-[length:70%_auto] sm:bg-center"
      />
      <SincronizadorZonaHoraria zonaActual={perfil.timezone} />
      <header className="sticky top-0 z-10 border-b border-borde bg-fondo/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/hoy"
              className="font-serif text-lg font-semibold tracking-tight text-texto"
            >
              Maresa
            </Link>
            <BotonInstalarPwa />
          </div>
          <UserButton
            appearance={{ elements: { avatarBox: "size-8" } }}
            userProfileProps={{ appearance: { elements: { rootBox: "w-full" } } }}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-28">
        {children}
      </main>

      <NavPrincipal esAdmin={esAdmin} />
    </div>
  );
}
