import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../features/auth/AuthProvider';

interface Notificacion {
  id: string;
  metaId: string;
  mensaje: string;
}

// Campanita de notificaciones "calculadas": no hay tabla de
// notificaciones ni nada que guardar — cada vez que se abre, recorre
// los grupos y metas activas del usuario y arma la lista al vuelo,
// con las mismas reglas que ya usa el dashboard (conciliación
// vencida, meta que llegó al monto pero no se cerró).
export function NotificacionesBell() {
  const { user } = useAuth();
  const location = useLocation();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [abierto, setAbierto] = useState(false);

  async function cargarNotificaciones() {
    if (!user) return;

    const { data: miembros } = await supabase
      .from('miembros_grupo')
      .select('grupo_id, grupos(frecuencia_conciliacion_dias)')
      .eq('usuario_id', user.id);
    if (!miembros || miembros.length === 0) {
      setNotificaciones([]);
      return;
    }

    const grupoIds = miembros.map((m) => m.grupo_id);
    const frecuenciaPorGrupo = new Map<string, number>();
    miembros.forEach((m) => {
      const g = m.grupos as unknown as { frecuencia_conciliacion_dias: number } | null;
      if (g) frecuenciaPorGrupo.set(m.grupo_id, g.frecuencia_conciliacion_dias);
    });

    const { data: metas } = await supabase
      .from('metas')
      .select('id, nombre, grupo_id, monto_objetivo, created_at')
      .in('grupo_id', grupoIds)
      .eq('estado', 'activa');
    if (!metas || metas.length === 0) {
      setNotificaciones([]);
      return;
    }

    const resultado: Notificacion[] = [];

    await Promise.all(
      metas.map(async (meta) => {
        const [{ data: transacciones }, { data: conciliaciones }] = await Promise.all([
          supabase.from('transacciones').select('tipo, monto').eq('meta_id', meta.id),
          supabase
            .from('conciliaciones')
            .select('fecha')
            .eq('meta_id', meta.id)
            .order('fecha', { ascending: false })
            .limit(1),
        ]);

        const acumulado = (transacciones ?? []).reduce(
          (t, x) => t + (x.tipo === 'deposito' ? x.monto : -x.monto),
          0,
        );

        // Meta que ya llegó al monto pero sigue sin cerrarse — esto
        // manda antes que la conciliación (si ya está completa, no
        // tiene sentido además avisar de conciliación pendiente).
        if (acumulado >= meta.monto_objetivo) {
          resultado.push({
            id: `${meta.id}-completada`,
            metaId: meta.id,
            mensaje: `🎉 "${meta.nombre}" alcanzó su monto — ciérrala`,
          });
          return;
        }

        const frecuencia = frecuenciaPorGrupo.get(meta.grupo_id) ?? 30;
        const fechaBase = conciliaciones?.[0]?.fecha ?? meta.created_at;
        const proximaFecha = new Date(fechaBase);
        proximaFecha.setDate(proximaFecha.getDate() + frecuencia);

        if (new Date() > proximaFecha) {
          resultado.push({
            id: `${meta.id}-conciliacion`,
            metaId: meta.id,
            mensaje: `⚠ "${meta.nombre}" tiene una conciliación pendiente`,
          });
        }
      }),
    );

    setNotificaciones(resultado);
  }

  // Se recalcula al montar y cada vez que cambias de página (para
  // que se actualice sola después de, por ejemplo, resolver una
  // conciliación o cerrar una meta).
  useEffect(() => {
    cargarNotificaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location.key]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="relative rounded-full p-2 text-gray-600 hover:bg-gray-200/50 transition-colors"
        title="Notificaciones"
      >
        🔔
        {notificaciones.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {notificaciones.length}
          </span>
        )}
      </button>

      {abierto && (
        <>
          {/* Capa invisible para cerrar el dropdown al hacer click afuera. */}
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
            <p className="px-2 py-1 text-xs font-semibold text-neutral-400">Notificaciones</p>
            {notificaciones.length === 0 ? (
              <p className="px-2 py-3 text-sm text-neutral-400">No tienes notificaciones.</p>
            ) : (
              <div className="flex flex-col">
                {notificaciones.map((n) => (
                  <Link
                    key={n.id}
                    to={`/meta/${n.metaId}`}
                    onClick={() => setAbierto(false)}
                    className="rounded-lg px-2 py-2 text-sm hover:bg-neutral-50"
                  >
                    {n.mensaje}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}