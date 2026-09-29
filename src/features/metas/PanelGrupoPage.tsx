import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import type { Meta } from "../../services/entities";
import { Header } from "../layout/Header";
import { useAuth } from "../auth/AuthProvider";
import { Spinner } from "../../components/Spinner";
import { Check, Sparkles, Pencil, Trash } from "lucide-react";

function formatearSoles(valor: number) {
  return `S/ ${valor.toLocaleString("es-PE")}`;
}

function formatearFecha(valor: string) {
  const fecha = new Date(valor.length === 10 ? `${valor}T00:00:00` : valor);
  return fecha.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
  });
}

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
  const [ahorrados, setAhorrados] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase
      .from("metas")
      .select("*")
      .eq("grupo_id", grupoId!)
      .order("created_at", { ascending: false })
      .then(({ data }) => setMetas(data ?? []));
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

  useEffect(() => {
    if (!metas) return;
    const idsActivas = metas
      .filter((m) => m.estado === "activa")
      .map((m) => m.id);
    if (idsActivas.length === 0) return;

    supabase
      .from("transacciones")
      .select("meta_id, monto")
      .in("meta_id", idsActivas)
      .then(({ data }) => {
        const suma: Record<string, number> = {};
        (data ?? []).forEach((d) => {
          suma[d.meta_id] = (suma[d.meta_id] ?? 0) + Number(d.monto);
        });
        setAhorrados(suma);
      });
  }, [metas]);

  async function handleConfirmarEliminar() {
    if (!metaAEliminar) return;
    setEliminando(true);
    setErrorEliminar("");
    const { error } = await supabase
      .from("metas")
      .delete()
      .eq("id", metaAEliminar.id);
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
    <div className="min-h-screen bg-neutral text-negro">
      <Header grupoIdActual={grupoId!} />

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
          <h1 className="text-2xl font-fraunces font-extrabold text-negro sm:text-3xl">
            Metas activas
          </h1>
          <Link
            to={`/grupo/${grupoId}/nueva-meta`}
            state={{ backgroundLocation: location }}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-azul px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#007A7E] sm:gap-2 sm:px-6 sm:py-3"
          >
            <span className="text-lg leading-none">+</span> Nueva meta
          </Link>
        </div>

        {activas.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activas.map((meta) => {
              const objetivo = Number(meta.monto_objetivo);
              const ahorrado = ahorrados[meta.id] ?? 0;
              const porcentaje =
                objetivo > 0
                  ? Math.min(100, Math.round((ahorrado / objetivo) * 100))
                  : 0;
              const faltan = Math.max(0, objetivo - ahorrado);

              return (
                <div key={meta.id} className="relative">
                  {esAdmin && (
                    <div className="absolute left-2 top-2 z-10 flex gap-1.5">
                      <Link
                        to={`/meta/${meta.id}/editar`}
                        state={{ backgroundLocation: location }}
                        title="Editar meta"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-600 shadow hover:bg-slate-200"
                      >
                        <Pencil className="w-4 h-4"/>
                      </Link>
                      <button
                        type="button"
                        title="Eliminar meta"
                        onClick={() => setMetaAEliminar(meta)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 shadow hover:bg-slate-200"
                      >
                        <Trash className="w-4 h-4"/>
                      </button>
                    </div>
                  )}
                  <Link
                    to={`/meta/${meta.id}`}
                    className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-md transition-all hover:shadow-xl"
                  >
                    <div className="relative">
                      {meta.imagen_url && imagenUrls[meta.imagen_url] ? (
                        <img
                          src={imagenUrls[meta.imagen_url]}
                          alt={meta.nombre}
                          className="h-32 w-full object-cover sm:h-48"
                        />
                      ) : (
                        <div className="flex h-32 w-full items-center justify-center bg-neutral-100 text-neutral-400 sm:h-48">
                          Sin imagen
                        </div>
                      )}
                      <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-azul shadow-sm">
                        {porcentaje}% alcanzado
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 p-4 sm:p-5">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-lg font-fraunces font-bold text-negro">
                          {meta.nombre}
                        </span>
                        <span className="shrink-0 text-lg font-semibold text-azul">
                          {porcentaje}%
                        </span>
                      </div>

                      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                        <div
                          className="h-full rounded-full bg-azul transition-all"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span>
                          <span className="font-semibold text-negro">
                            {formatearSoles(ahorrado)}
                          </span>
                          <span className="text-neutral-400">
                            {" "}
                            / {formatearSoles(objetivo)}
                          </span>
                        </span>
                        <span className="text-neutral-500">
                          Faltan {formatearSoles(faltan)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Aún no hay metas activas.</p>
        )}

        <h2 className="mb-4 mt-10 text-2xl font-fraunces font-bold text-negro">
          Metas completadas
        </h2>
        {completadas.length === 0 ? (
          <p className="text-sm text-neutral-400">
            Aún no hay metas completadas.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completadas.map((meta) => (
              <Link
                key={meta.id}
                to={`/meta/${meta.id}`}
                className="flex flex-col overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 shadow-md transition-all hover:shadow-xl"
              >
                <div className="relative">
                  {meta.imagen_cierre_url &&
                  imagenUrls[meta.imagen_cierre_url] ? (
                    <img
                      src={imagenUrls[meta.imagen_cierre_url]}
                      alt={meta.nombre}
                      className="h-32 w-full object-cover sm:h-48"
                    />
                  ) : (
                    <div className="flex h-32 w-full items-center justify-center bg-neutral-100 text-neutral-400 sm:h-48">
                      Sin foto de cierre
                    </div>
                  )}
                  <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-emerald-100/95 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
                    <Check className="h-3 w-3" strokeWidth={3} />
                    Meta cumplida
                  </span>
                </div>

                <div className="flex flex-col gap-2 p-4 sm:p-5">
                  <span className="flex items-center gap-2 text-base font-semibold text-emerald-900 font-fraunces">
                    <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
                    {meta.nombre}
                  </span>
                  <span className="text-xs text-emerald-800/80">
                    {formatearSoles(Number(meta.monto_objetivo))}
                    {meta.fecha_cierre && (
                      <> · alcanzada el {formatearFecha(meta.fecha_cierre)}</>
                    )}
                  </span>
                  {meta.comentario_cierre && (
                    <p className="line-clamp-2 rounded-lg bg-white/70 px-3 py-2 text-xs italic text-emerald-800">
                      “{meta.comentario_cierre}”
                    </p>
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
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl bg-white p-6"
          >
            <h2 className="text-lg font-bold">
              ¿Eliminar "{metaAEliminar.nombre}"?
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              Se van a borrar también sus depósitos, minimetas y conciliaciones.
              Esta acción no se puede deshacer.
            </p>
            {errorEliminar && (
              <p className="mt-2 text-xs text-red-600">{errorEliminar}</p>
            )}
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
