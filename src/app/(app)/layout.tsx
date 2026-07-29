import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

import { NavPrincipal } from "@/components/nav-principal";

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

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-borde bg-fondo/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/hoy"
            className="font-serif text-lg font-semibold tracking-tight text-texto"
          >
            Ciclos
          </Link>
          <UserButton
            appearance={{ elements: { avatarBox: "size-8" } }}
            userProfileProps={{ appearance: { elements: { rootBox: "w-full" } } }}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-28">
        {children}
      </main>

      <NavPrincipal />
    </div>
  );
}
