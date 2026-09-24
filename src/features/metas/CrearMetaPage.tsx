import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';

export function CrearMetaPage() {
  const { grupoId } = useParams<{ grupoId: string }>();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [montoObjetivo, setMontoObjetivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErrorMsg('');

    // A diferencia de grupos, aquí SÍ hacemos un insert directo —
    // la tabla metas ya tiene su propia política de RLS
    // ("crear metas en mis grupos") que valida que seas miembro
    // del grupo, así que no hace falta una función intermedia.
    const { data, error } = await supabase
      .from('metas')
      .insert({ grupo_id: grupoId!, nombre, monto_objetivo: Number(montoObjetivo) })
      .select()
      .single();

    if (error) {
      setErrorMsg(error.message);
      setEnviando(false);
      return;
    }

    navigate(`/meta/${data.id}`);
  }

  return (
    <div className="flex h-screen items-center justify-center bg-neutral-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-7"
      >
        <h1 className="text-lg font-bold">Nueva meta</h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="nombre" className="text-xs text-neutral-500">Nombre de la meta</label>
          <input
            id="nombre"
            required
            placeholder="Inicial del departamento"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="monto" className="text-xs text-neutral-500">Monto objetivo (S/)</label>
          <input
            id="monto"
            type="number"
            min={1}
            required
            value={montoObjetivo}
            onChange={(e) => setMontoObjetivo(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-neutral-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {enviando ? 'Creando...' : 'Crear meta'}
        </button>
      </form>
    </div>
  );
}