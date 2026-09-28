import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from './AuthProvider';

export function MiPerfilPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [nombre, setNombre] = useState('');
  const [miembroDesde, setMiembroDesde] = useState<string | null>(null);
  const [cantidadGrupos, setCantidadGrupos] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!user) return;

    supabase
      .from('perfiles')
      .select('nombre, created_at')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setNombre(data?.nombre ?? '');
        setMiembroDesde(data?.created_at ?? null);
        setCargando(false);
      });

    supabase
      .from('miembros_grupo')
      .select('grupo_id', { count: 'exact', head: true })
      .eq('usuario_id', user.id)
      .then(({ count }) => setCantidadGrupos(count ?? 0));
  }, [user]);

  function cerrar() {
    navigate(-1);
  }

  async function handleGuardar() {
    if (!user || !nombre.trim()) return;
    setErrorMsg('');
    setGuardando(true);
    const { error } = await supabase.from('perfiles').update({ nombre }).eq('id', user.id);
    setGuardando(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  }

  if (cargando) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={cerrar}>
        <div className="rounded-xl bg-white p-6 text-sm text-neutral-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={cerrar}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-sm flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-7"
      >
        <button type="button" onClick={cerrar} aria-label="Cerrar" className="absolute right-4 top-4 text-neutral-400">
          ×
        </button>

        <div className="flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#C8E6DF] text-2xl font-bold text-[#006656]">
            {nombre ? nombre.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-lg font-bold">Mi perfil</h1>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="nombre" className="text-xs text-neutral-500">Nombre</label>
          <input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500">Correo</label>
          <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500">
            {user?.email}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-400">
          {miembroDesde && <span>Miembro desde {new Date(miembroDesde).toLocaleDateString()}</span>}
          {cantidadGrupos !== null && (
            <span>
              {cantidadGrupos} {cantidadGrupos === 1 ? 'grupo' : 'grupos'}
            </span>
          )}
        </div>

        {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}

        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando || !nombre.trim()}
          className="rounded-md bg-neutral-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : guardado ? '✓ Guardado' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}