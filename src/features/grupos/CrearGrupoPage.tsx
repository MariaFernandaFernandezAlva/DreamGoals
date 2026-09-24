import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';

export function CrearGrupoPage() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [cantidadIntegrantes, setCantidadIntegrantes] = useState(2);
  const [frecuencia, setFrecuencia] = useState(30);
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErrorMsg('');

    // Llamamos a la función, no hacemos insert directo — ella crea
    // el grupo Y agrega a esta persona como admin en un solo paso.
    const { data: grupoId, error } = await supabase.rpc('crear_grupo', {
      p_nombre: nombre,
      p_cantidad_integrantes: cantidadIntegrantes,
      p_frecuencia_dias: frecuencia,
    });

    if (error) {
      setErrorMsg(error.message);
      setEnviando(false);
      return;
    }

    // Con el id del grupo ya creado, vamos a la pantalla que muestra
    // el link de invitación generado.
    navigate(`/invitacion/${grupoId}`);
  }

  return (
    <div className="flex h-screen items-center justify-center bg-neutral-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-7"
      >
        <h1 className="text-lg font-bold">Crea tu grupo</h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="nombre" className="text-xs text-neutral-500">Nombre del grupo</label>
          <input
            id="nombre"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="integrantes" className="text-xs text-neutral-500">Cantidad máxima de integrantes</label>
          <input
            id="integrantes"
            type="number"
            min={1}
            required
            value={cantidadIntegrantes}
            onChange={(e) => setCantidadIntegrantes(Number(e.target.value))}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs text-neutral-500">Frecuencia de conciliación</span>
          <label className="flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <input type="radio" checked={frecuencia === 14} onChange={() => setFrecuencia(14)} />
            Cada 14 días
          </label>
          <label className="flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <input type="radio" checked={frecuencia === 30} onChange={() => setFrecuencia(30)} />
            Cada 30 días
          </label>
        </div>

        {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-neutral-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {enviando ? 'Creando...' : 'Crear grupo y generar link'}
        </button>
      </form>
    </div>
  );
}