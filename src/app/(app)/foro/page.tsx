import type { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";

import { perfilActual } from "@/lib/dal/cycles";
import { listarPosts, type PostConAutor } from "@/lib/dal/foro";
import { FormularioPostForo } from "@/components/formulario-post-foro";
import { TarjetaPostForo } from "@/components/tarjeta-post-foro";
import { ActivadorNotificaciones } from "@/components/activador-notificaciones";

export const metadata: Metadata = {
  title: "Foro",
};

export default async function PaginaForo() {
  const [perfil, usuario, posts] = await Promise.all([
    perfilActual(),
    currentUser(),
    listarPosts(),
  ]);

  const esAdmin = usuario?.publicMetadata?.role === "admin";
  const puedeBorrar = (post: PostConAutor) => esAdmin || post.userId === perfil.id;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-lg font-semibold tracking-tight">Foro</h1>
        <p className="mt-1 text-sm text-tenue">
          Un espacio para compartir con la comunidad — con tu nombre o de forma anónima.
        </p>
      </div>

      <ActivadorNotificaciones />

      <FormularioPostForo />

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-borde bg-superficie p-5 text-center text-sm text-tenue">
          Todavía no hay publicaciones. ¡Sé la primera en compartir algo!
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            <TarjetaPostForo key={post.id} post={post} puedeBorrar={puedeBorrar} />
          ))}
        </ul>
      )}
    </div>
  );
}
