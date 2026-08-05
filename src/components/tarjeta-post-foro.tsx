import Image from "next/image";

import type { PostConAutor } from "@/lib/dal/foro";
import { haceTiempo } from "@/lib/format";
import { accionBorrarPost } from "@/app/(app)/foro/actions";
import { BotonResponder } from "@/components/boton-responder";

export function TarjetaPostForo({
  post,
  puedeBorrar,
  esRespuesta = false,
}: {
  post: PostConAutor;
  /** Se evalúa por post: distingue autora propia/admin en el hilo entero. */
  puedeBorrar: (post: PostConAutor) => boolean;
  esRespuesta?: boolean;
}) {
  const nombre = post.autor?.nombre ?? "Anónimo";
  const tamanioAvatar = esRespuesta ? 28 : 36;

  return (
    <li
      className={
        esRespuesta
          ? "flex flex-col gap-2 py-1"
          : "flex flex-col gap-2 rounded-2xl border border-borde bg-superficie p-4"
      }
    >
      <div className="flex items-center gap-3">
        {post.autor ? (
          <Image
            src={post.autor.fotoUrl}
            alt=""
            width={tamanioAvatar}
            height={tamanioAvatar}
            className="shrink-0 rounded-full object-cover"
            style={{ width: tamanioAvatar, height: tamanioAvatar }}
          />
        ) : (
          <span
            aria-hidden
            className="flex shrink-0 items-center justify-center rounded-full bg-fondo text-lg"
            style={{ width: tamanioAvatar, height: tamanioAvatar }}
          >
            🌑
          </span>
        )}

        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{nombre}</span>
            {post.autor?.esAdmin && (
              <span className="shrink-0 rounded-full bg-luna px-1.5 py-0.5 text-[10px] font-semibold leading-none text-abismo">
                Admin
              </span>
            )}
          </div>
          <span className="text-xs text-tenue">{haceTiempo(post.createdAt)}</span>
        </div>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.contenido}</p>

      <div className="flex items-center gap-4">
        <BotonResponder postId={post.id} />
        {puedeBorrar(post) && (
          <form action={accionBorrarPost}>
            <input type="hidden" name="id" value={post.id} />
            <button
              type="submit"
              className="text-xs font-medium text-fase-menstrual hover:underline"
            >
              Eliminar
            </button>
          </form>
        )}
      </div>

      {!esRespuesta && post.respuestas.length > 0 && (
        <ul className="ml-4 flex flex-col gap-2 border-l border-borde pl-4 sm:ml-5">
          {post.respuestas.map((respuesta) => (
            <TarjetaPostForo
              key={respuesta.id}
              post={respuesta}
              puedeBorrar={puedeBorrar}
              esRespuesta
            />
          ))}
        </ul>
      )}
    </li>
  );
}
