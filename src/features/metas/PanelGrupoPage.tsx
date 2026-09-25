import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import type { Meta } from "../../services/entities";
import { Header } from "../layout/Header"; // <-- Importamos el nuevo Header

export function PanelGrupoPage() {
  const { grupoId } = useParams<{ grupoId: string }>();
  const [metas, setMetas] = useState<Meta[] | null>(null);
  const [imagenUrls, setImagenUrls] = useState<Record<string, string>>({});
  const location = useLocation();

  useEffect(() => {
    supabase
      .from("metas")
      .select("*")
      .eq("grupo_id", grupoId!)
      .order("created_at", { ascending: false })
      .then(({ data }) => setMetas(data ?? []));
  }, [grupoId]);

  useEffect(() => {
    if (!metas) return;
    const paths = metas
      .map((m) => m.imagen_url)
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

  if (!metas) return <div className="p-8 text-center">Cargando metas...</div>;

  const activas = metas.filter((m) => m.estado === "activa");
  const completadas = metas.filter((m) => m.estado === "completada");

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1B1B1B]">
      
      {/* 1. Header Integrado arriba */}
      <Header grupoIdActual={grupoId!} />

      {/* 2. Contenido Principal con ancho expandido (max-w-7xl) */}
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        
        {/* Cabecera de la sección de Metas */}
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

        {/* Rejilla de Metas Activas */}
        {activas.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activas.map((meta) => {
              return (
                <Link
                  key={meta.id}
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
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Aún no hay metas activas.</p>
        )}

        {/* Sección de Metas Completadas */}
        <h2 className="mb-6 mt-12 text-2xl font-heading font-bold text-[#1B1B1B]">Metas completadas</h2>
        {completadas.length === 0 ? (
          <p className="text-sm text-neutral-400">
            Aún no hay metas completadas.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completadas.map((meta) => (
              <div
                key={meta.id}
                className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-md"
              >
                <span className="text-lg font-heading font-bold text-[#1B1B1B]">{meta.nombre}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}