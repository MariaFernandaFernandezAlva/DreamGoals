import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import type { Grupo } from '../../services/entities';
import { useAuth } from '../auth/AuthProvider';

interface MiembroFila {
  usuario_id: string;
  nombre: string;
  rol: string;
}

export function ConfiguracionGrupoPage() {
  const { grupoId } = useParams<{ grupoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [miembros, setMiembros] = useState<MiembroFila[]>([]);
  const [cantidadIntegrantes, setCantidadIntegrantes] = useState('');
  const [frecuenciaDias, setFrecuenciaDias] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [regenerando, setRegenerando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const esAdmin = miembros.find((m) => m.usuario_id === user?.id)?.rol === 'admin';

  function recargarGrupo() {
    supabase
      .from('grupos')
      .select('*')
      .eq('id', grupoId!)
      .single()
      .then(({ data }) => {
        setGrupo(data);
        if (data) {
          setCantidadIntegrantes(String(data.cantidad_integrantes));
          setFrecuenciaDias(String(data.frecuencia_conciliacion_dias));
        }
      });
  }

  function recargarMiembros() {
    supabase
      .from('miembros_grupo')
      .select('usuario_id, rol, perfiles(nombre)')
      .eq('grupo_id', grupoId!)
      .then(({ data }) => {
        const lista = (data ?? []).map((m) => ({
          usuario_id: m.usuario_id,
          rol: m.rol,
          nombre: (m.perfiles as unknown as { nombre: string } | null)?.nombre ?? 'Sin nombre',
        }));
        setMiembros(lista);
      });
  }

  useEffect(() => {
    recargarGrupo();
    recargarMiembros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupoId]);

  function cerrar() {
    navigate(-1);
  }

  async function handleRemover(usuarioId: string) {
    setErrorMsg('');
    const { error } = await supabase
      .from('miembros_grupo')
      .delete()
      .eq('grupo_id', grupoId!)
      .eq('usuario_id', usuarioId);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    recargarMiembros();
  }

  async function handleRegenerarLink() {
    setRegenerando(true);
    const nuevoCodigo = `DG-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const { error } = await supabase.from('grupos').update({ invite_code: nuevoCodigo }).eq('id', grupoId!);
    setRegenerando(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    recargarGrupo();
  }

  function handleCopiarLink() {
    if (!grupo) return;
    navigator.clipboard.writeText(`https://dreamgoals.app/unirse/${grupo.invite_code}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function handleGuardar() {
    setErrorMsg('');
    if (Number(cantidadIntegrantes) < miembros.length) {
      setErrorMsg(`El cupo no puede ser menor a los ${miembros.length} miembros actuales.`);
      return;
    }
    setGuardando(true);
    const { error } = await supabase.rpc('actualizar_configuracion_grupo', {
      p_grupo_id: grupoId!,
      p_cantidad_integrantes: Number(cantidadIntegrantes),
      p_frecuencia_dias: Number(frecuenciaDias),
    });
    setGuardando(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    cerrar();
  }

  if (!grupo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={cerrar}>
        <div className="rounded-xl bg-white p-6">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={cerrar}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col gap-6 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-7"
      >
        <button type="button" onClick={cerrar} aria-label="Cerrar" className="absolute right-4 top-4 text-neutral-400">
          ×
        </button>

        <h1 className="text-lg font-bold">Configuración del grupo</h1>

        {/* --- Miembros --- */}
        <div className="rounded-xl border border-neutral-200 p-5">
          <div className="mb-3 flex items-center justify-between text-sm font-semibold">
            <span>Miembros</span>
            <span className="text-neutral-400">
              {miembros.length} / {grupo.cantidad_integrantes}
            </span>
          </div>
          <div className="flex flex-col divide-y divide-neutral-100">
            {miembros.map((m) => (
              <div key={m.usuario_id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700">
                    {m.nombre[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {m.nombre} {m.usuario_id === user?.id && <span className="text-neutral-400">(tú)</span>}
                    </p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                        m.rol === 'admin' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {m.rol === 'admin' ? 'Admin' : 'Miembro'}
                    </span>
                  </div>
                </div>
                {esAdmin && m.rol !== 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleRemover(m.usuario_id)}
                    className="text-xs font-medium text-red-500 hover:underline"
                  >
                    🗑 Remover
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* --- Link de invitación --- */}
        <div className="rounded-xl border border-neutral-200 p-5">
          <p className="mb-1 text-sm font-semibold">Link de invitación</p>
          <p className="mb-3 text-xs text-neutral-400">Reutilizable mientras haya cupo en el grupo.</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 truncate rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
              https://dreamgoals.app/unirse/{grupo.invite_code}
            </div>
            <button
              type="button"
              onClick={handleCopiarLink}
              className="rounded-md border border-neutral-200 px-3 py-2 text-xs"
              title="Copiar"
            >
              {copiado ? '✓' : '📋'}
            </button>
            {esAdmin && (
              <button
                type="button"
                onClick={handleRegenerarLink}
                disabled={regenerando}
                className="rounded-md border border-neutral-200 px-3 py-2 text-xs disabled:opacity-50"
                title="Regenerar link"
              >
                🔄
              </button>
            )}
          </div>
        </div>

        {/* --- Cupo y frecuencia --- */}
        <div className="rounded-xl border border-neutral-200 p-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">Máximo de integrantes</label>
            <input
              type="number"
              min={miembros.length}
              value={cantidadIntegrantes}
              disabled={!esAdmin}
              onChange={(e) => setCantidadIntegrantes(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50 disabled:text-neutral-400"
            />
            <p className="text-xs text-neutral-400">No puede ser menor a los miembros actuales.</p>
          </div>

          <div className="mt-4 flex flex-col gap-1">
            <label className="text-xs text-neutral-500">Frecuencia de conciliación</label>
            <select
              value={frecuenciaDias}
              disabled={!esAdmin}
              onChange={(e) => setFrecuenciaDias(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50 disabled:text-neutral-400"
            >
              <option value="14">Quincenal</option>
              <option value="30">Mensual</option>
            </select>
          </div>
        </div>

        {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}

        {esAdmin && (
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando}
            className="rounded-md bg-neutral-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        )}
      </div>
    </div>
  );
}