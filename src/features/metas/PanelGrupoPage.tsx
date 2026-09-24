import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import type { Meta } from '../../services/entities';

export function PanelGrupoPage() {
  const { grupoId } = useParams<{ grupoId: string }>();
  const [metas, setMetas] = useState<Meta[] | null>(null);

  useEffect(() => {
    supabase
      .from('metas')
      .select('*')
      .eq('grupo_id', grupoId!)
      .order('created_at', { ascending: false })
      .then(({ data }) => setMetas(data ?? []));
  }, [grupoId]);

  if (!metas) return null;

  const activas = metas.filter((m) => m.estado === 'activa');
  const completadas = metas.filter((m) => m.estado === 'completada');

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold">Metas activas</h1>
        <Link
          to={`/grupo/${grupoId}/nueva-meta`}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          + Nueva meta
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {activas.map((meta) => {
          // El progreso real (sumar transacciones) lo calculamos en el
          // dashboard de la meta, que es el siguiente paso — aquí, por
          // ahora, solo mostramos el monto objetivo.
          return (
            <Link
              key={meta.id}
              to={`/meta/${meta.id}`}
              className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-5"
            >
              <span className="text-sm font-semibold">{meta.nombre}</span>
              <span className="text-xs text-neutral-500">Objetivo: S/ {meta.monto_objetivo}</span>
            </Link>
          );
        })}
      </div>

      {activas.length === 0 && (
        <p className="text-sm text-neutral-400">Aún no hay metas activas.</p>
      )}

      <h2 className="mb-3 mt-8 text-base font-semibold">Metas completadas</h2>
      {completadas.length === 0 ? (
        <p className="text-sm text-neutral-400">Aún no hay metas completadas.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {completadas.map((meta) => (
            <div key={meta.id} className="rounded-lg border border-neutral-200 bg-white p-5">
              <span className="text-sm font-semibold">{meta.nombre}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}