import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import type { Meta } from "../../services/entities";
import { Header } from "../layout/Header";
import { useAuth } from "../auth/AuthProvider";
import { Spinner } from '../../components/Spinner';

export function PanelGrupoPage() {
  const { grupoId } = useParams<{ grupoId: string }>();
  const { user } = useAuth();
  const [metas, setMetas] = useState<Meta[] | null>(null);
  const [imagenUrls, setImagenUrls] = useState<Record<string, string>>({});
  const [esAdmin, setEsAdmin] = useState(false);
  const [metaAEliminar, setMetaAEliminar] = useState<Meta | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState("");
  const location = useLocation();

  useEffect(() => {
    supabase
      .from("metas")
      .select("*")
      .eq("grupo_id", grupoId!)
      .order("created_at", { ascending: false })
      .then(({ data }) => setMetas(data ?? []));
    // location.key para que, al volver de crear/editar/eliminar una
    // meta (modal con replace), esta lista se refresque sola.
  }, [grupoId, location.key]);

  useEffect(() => {
    if (!grupoId || !user) return;
    supabase
      .from("miembros_grupo")
      .select("rol")
      .eq("grupo_id", grupoId)
      .eq("usuario_id", user.id)
      .single()
      .then(({ data }) => setEsAdmin(data?.rol === "admin"));
  }, [grupoId, user]);

  useEffect(() => {
    if (!metas) return;
    const paths = metas
      .flatMap((m) => [m.imagen_url, m.imagen_cierre_url])
      .filter((p): p is string => !!p);
    if (paths.length === 0) return;

    supabase.storage
      .from("evidencias")
      .createSignedUrls(paths, 3600)
      .then(({ data }) => {
        if (!data) return;
        const mapa: Record<string, string> = {};
        data.forEach((item) => {
          if (item.signedUrl) mapa[item.path!] = item.signedUrl;
        });
        setImagenUrls(mapa);
      });
  }, [metas]);

  async function handleConfirmarEliminar() {
    if (!metaAEliminar) return;
    setEliminando(true);
    setErrorEliminar("");
    const { error } = await supabase.from("metas").delete().eq("id", metaAEliminar.id);
    setEliminando(false);
    if (error) {
      setErrorEliminar(error.message);
      return;
    }
    setMetas((prev) => prev?.filter((m) => m.id !== metaAEliminar.id) ?? null);
    setMetaAEliminar(null);
  }

  if (!metas) return <Spinner />;

  const activas = metas.filter((m) => m.estado === "activa");
  const completadas = metas.filter((m) => m.estado === "completada");

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1B1B1B]">
      <Header grupoIdActual={grupoId!} />

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-heading font-extrabold text-[#1B1B1B]">Metas activas</h1>
          <Link
            to={`/grupo/${grupoId}/nueva-meta`}
            state={{ backgroundLocation: location }}
            className="flex items-center gap-2 rounded-full bg-azul px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#007A7E] transition-colors"
          >
            <span className="text-lg leading-none">+</span> Nueva meta
          </Link>
        </div>

        {activas.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activas.map((meta) => (
              <div key={meta.id} className="relative">
                {esAdmin && (
                  <div className="absolute right-2 top-2 z-10 flex gap-1.5">
                    <Link
                      to={`/meta/${meta.id}/editar`}
                      state={{ backgroundLocation: location }}
                      title="Editar meta"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-600 shadow hover:bg-white"
                    >
                      ✏️
                    </Link>
                    <button
                      type="button"
                      title="Eliminar meta"
                      onClick={() => setMetaAEliminar(meta)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 shadow hover:bg-white"
                    >
                      🗑
                    </button>
                  </div>
                )}
                <Link
                  to={`/meta/${meta.id}`}
                  className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-md hover:shadow-xl transition-all"
                >
                  {meta.imagen_url && imagenUrls[meta.imagen_url] ? (
                    <img
                      src={imagenUrls[meta.imagen_url]}
                      alt={meta.nombre}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-neutral-100 text-neutral-400">
                      Sin imagen
                    </div>
                  )}
                  <div className="p-5 flex flex-col gap-2">
                    <span className="text-lg font-heading font-bold text-[#1B1B1B]">{meta.nombre}</span>
                    <span className="text-sm text-neutral-500">
                      Objetivo: S/ {meta.monto_objetivo}
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Aún no hay metas activas.</p>
        )}

        <h2 className="mb-6 mt-12 text-2xl font-heading font-bold text-[#1B1B1B]">Metas completadas</h2>
        {completadas.length === 0 ? (
          <p className="text-sm text-neutral-400">Aún no hay metas completadas.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completadas.map((meta) => (
              <Link
                key={meta.id}
                to={`/meta/${meta.id}`}
                className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-md hover:shadow-xl transition-all"
              >
                {meta.imagen_cierre_url && imagenUrls[meta.imagen_cierre_url] ? (
                  <img
                    src={imagenUrls[meta.imagen_cierre_url]}
                    alt={meta.nombre}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-neutral-100 text-neutral-400">
                    Sin foto de cierre
                  </div>
                )}
                <div className="flex flex-col gap-2 p-5">
                  <span className="text-lg font-heading font-bold text-[#1B1B1B]">{meta.nombre}</span>
                  {meta.fecha_cierre && (
                    <span className="text-xs text-neutral-400">
                      Completada el {new Date(meta.fecha_cierre).toLocaleDateString()}
                    </span>
                  )}
                  {meta.comentario_cierre && (
                    <p className="line-clamp-2 text-sm text-neutral-600">{meta.comentario_cierre}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {metaAEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setMetaAEliminar(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl bg-white p-6">
            <h2 className="text-lg font-bold">¿Eliminar "{metaAEliminar.nombre}"?</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Se van a borrar también sus depósitos, minimetas y conciliaciones. Esta acción no se puede deshacer.
            </p>
            {errorEliminar && <p className="mt-2 text-xs text-red-600">{errorEliminar}</p>}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setMetaAEliminar(null)}
                className="flex-1 rounded-md border border-neutral-300 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                disabled={eliminando}
                className="flex-1 rounded-md bg-red-600 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {eliminando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}