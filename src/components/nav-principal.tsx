"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ENLACES_BASE = [
  { href: "/hoy", etiqueta: "Hoy", icono: "☀" },
  { href: "/registro", etiqueta: "Registro", icono: "✎" },
  { href: "/calendario", etiqueta: "Syncronario", icono: "▦" },
  { href: "/foro", etiqueta: "Tribu", icono: "◈" },
] as const;

const ENLACE_ADMIN = { href: "/admin/consejos", etiqueta: "Admin", icono: "⚙" } as const;

export function NavPrincipal({ esAdmin = false }: { esAdmin?: boolean }) {
  const ruta = usePathname();
  const enlaces = esAdmin ? [...ENLACES_BASE, ENLACE_ADMIN] : ENLACES_BASE;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-borde bg-superficie/95 backdrop-blur"
    >
      <ul className="mx-auto flex w-full max-w-3xl">
        {enlaces.map(({ href, etiqueta, icono }) => {
          const activo = ruta === href || ruta.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={activo ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  activo
                    ? "text-oceano"
                    : "text-tenue hover:text-texto"
                }`}
              >
                <span aria-hidden className="text-base leading-none">
                  {icono}
                </span>
                {etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
