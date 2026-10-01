import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/Supabaseclient';
import type { Grupo } from '../../services/entities';
import { useAuth } from '../auth/AuthProvider';
import { Spinner } from '../../components/Spinner';
import { Check, Copy, RotateCcw, LogOut, Trash } from "lucide-react";

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
  const [confirmandoSalidaOEliminacion, setConfirmandoSalidaOEliminacion] = useState(false);
  const [procesandoSalida, setProcesandoSalida] = useState(false);

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
    navigator.clipboard.writeText(`${window.location.origin}/unirse/${grupo.invite_code}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function handleConfirmarSalidaOEliminacion() {
    setErrorMsg('');
    setProcesandoSalida(true);

    const { error } = esAdmin
      ? await supabase.from('grupos').delete().eq('id', grupoId!)
      : await supabase.from('miembros_grupo').delete().eq('grupo_id', grupoId!).eq('usuario_id', user!.id);

    setProcesandoSalida(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    navigate('/mis-grupos', { replace: true });
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
    return <Spinner variante="modal"/>;
  }

  const link = `${window.location.origin}/unirse/${grupo.invite_code}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={cerrar}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[95vh] w-full max-w-md flex-col gap-6 overflow-y-auto rounded-4xl bg-[#FAFAF7] p-8 shadow-2xl [&::-webkit-scrollbar]:hidden"
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute right-6 top-6 text-neutral-400 transition-colors hover:text-neutral-600"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-neutral-900">
              Configuración
            </h1>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Administra tu grupo
            </p>
          </div>
        </div>

        {/* --- Miembros --- */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-700">Miembros</h2>
            <span className="rounded-full bg-neutral-200/60 px-2.5 py-1 text-[10px] font-bold text-neutral-600">
              {miembros.length} / {grupo.cantidad_integrantes}
            </span>
          </div>
          <div className="flex flex-col divide-y divide-neutral-100 rounded-2xl border border-neutral-200/60 bg-white px-5 shadow-sm">
            {miembros.map((m) => (
              <div key={m.usuario_id} className="flex items-center justify-between py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100/80 text-sm font-bold text-amber-700">
                    {m.nombre[0]}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold text-neutral-800">
                      {m.nombre} {m.usuario_id === user?.id && <span className="font-normal text-neutral-400">(tú)</span>}
                    </p>
                    <span
                      className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
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
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Remover miembro"
                  >
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* --- Link de invitación --- */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col">
            <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-700">Link de invitación</h2>
            <p className="mt-0.5 text-xs text-neutral-400">Reutilizable mientras haya cupo en el grupo.</p>
          </div>
          <div className="flex items-center gap-2">
            <input 
              id="link" 
              readOnly 
              value={link} 
              className="flex-1 truncate rounded-xl border border-neutral-200/60 bg-white px-4 py-3.5 text-sm text-neutral-600 shadow-sm"/>
            <button
              type="button"
              onClick={handleCopiarLink}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-neutral-600 shadow-sm ring-1 ring-inset ring-neutral-200/60 transition-all hover:bg-neutral-50 hover:text-neutral-900"
              title="Copiar link"
            >
              {copiado ? (
                <Check className="h-5 w-5 text-emerald-600"/>
              ) : (
                <Copy className="h-5 w-5"/>
              )}
            </button>
            {esAdmin && (
              <button
                type="button"
                onClick={handleRegenerarLink}
                disabled={regenerando}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-neutral-600 shadow-sm ring-1 ring-inset ring-neutral-200/60 transition-all hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-50"
                title="Regenerar link"
              >
                <RotateCcw className={`h-5 w-5 ${regenerando ? 'animate-spin' : ''}`}/>
              </button>
            )}
          </div>
        </div>

        {/* --- Cupo y frecuencia --- */}
        <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wide text-neutral-700">Máximo de integrantes</label>
            </div>
            <input
              type="number"
              min={miembros.length}
              value={cantidadIntegrantes}
              disabled={!esAdmin}
              onChange={(e) => setCantidadIntegrantes(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-transparent px-4 py-3.5 text-sm text-neutral-800 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
            />
            <p className="text-[11px] text-neutral-400">No puede ser menor a los miembros actuales.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wide text-neutral-700">Frecuencia de conciliación</label>
            <select
              value={frecuenciaDias}
              disabled={!esAdmin}
              onChange={(e) => setFrecuenciaDias(e.target.value)}
              className="w-full appearance-none rounded-xl border border-neutral-200 bg-transparent px-4 py-3.5 text-sm text-neutral-800 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
            >
              <option value="14">Quincenal</option>
              <option value="30">Mensual</option>
            </select>
          </div>
        </div>

        {errorMsg && <p className="text-center text-xs font-medium text-red-600">{errorMsg}</p>}

        {/* Botones de acción principales */}
        {esAdmin && (
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#008A8A] py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-teal-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        )}

        {/* --- Zona de peligro --- */}
        <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-red-100 bg-[#FFF7F7] p-5 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-red-700">Zona de peligro</h2>
          <p className="text-xs leading-relaxed text-red-900/70">
            {esAdmin
              ? 'Como admin, no puedes salir del grupo sin más — la única opción es eliminarlo por completo.'
              : 'Puedes salir del grupo cuando quieras. Vas a dejar de ver sus metas y movimientos.'}
          </p>
          <button
            type="button"
            onClick={() => setConfirmandoSalidaOEliminacion(true)}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 text-sm font-semibold text-red-600 shadow-sm transition-colors hover:bg-red-50 hover:border-red-300"
          >
            {esAdmin ? (
              <>
                <Trash className="h-4 w-4"/>
                Eliminar grupo
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4"/>
                Salir del grupo
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal de confirmación (Salida o Eliminación) */}
      {confirmandoSalidaOEliminacion && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={() => setConfirmandoSalidaOEliminacion(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-4xl bg-white p-8 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-7 w-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-center font-serif text-xl font-bold text-neutral-900">
              {esAdmin ? `¿Eliminar "${grupo.nombre}"?` : `¿Salir de "${grupo.nombre}"?`}
            </h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-neutral-500">
              {esAdmin
                ? 'Se van a borrar todos los miembros, metas, depósitos, minimetas y conciliaciones del grupo. Esta acción no se puede deshacer.'
                : 'Vas a dejar de ver este grupo y sus metas. Si cambias de opinión, alguien del grupo tendría que volver a invitarte.'}
            </p>
            {errorMsg && <p className="mt-3 text-center text-xs font-medium text-red-600">{errorMsg}</p>}
            
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleConfirmarSalidaOEliminacion}
                disabled={procesandoSalida}
                className="w-full rounded-2xl bg-red-600 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {procesandoSalida ? 'Procesando...' : esAdmin ? 'Sí, eliminar grupo' : 'Sí, salir del grupo'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoSalidaOEliminacion(false)}
                className="w-full rounded-2xl py-3.5 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-100"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}