import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import type { Grupo } from '../../services/entities';

export function InvitacionPage() {
  // El id del grupo viene en la URL: /invitacion/:grupoId
  const { grupoId } = useParams<{ grupoId: string }>();
  const navigate = useNavigate();
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    supabase
      .from('grupos')
      .select('*')
      .eq('id', grupoId!)
      .single()
      .then(({ data }) => setGrupo(data));
  }, [grupoId]);

  if (!grupo) return null; // podría mostrar un spinner más adelante

  const link = `${window.location.origin}/unirse/${grupo.invite_code}`;

  function copiarLink() {
    navigator.clipboard.writeText(link);
    setCopiado(true);
  }

  return (
    <div className="flex h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-7">
        <div>
          <p className="text-xs text-neutral-500">✓ Grupo creado</p>
          <h1 className="mt-0.5 text-lg font-bold">{grupo.nombre}</h1>
        </div>

        <div className="flex gap-4 text-sm">
          <div>
            <p className="text-xs text-neutral-500">Integrantes máx.</p>
            <p className="font-semibold">{grupo.cantidad_integrantes}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Conciliación</p>
            <p className="font-semibold">Cada {grupo.frecuencia_conciliacion_dias} días</p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="link" className="text-xs text-neutral-500">Link de invitación</label>
          <div className="flex gap-2">
            <input id="link" readOnly value={link} className="flex-1 rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs" />
            <button onClick={copiarLink} className="rounded-md border border-neutral-900 px-3 text-xs">
              {copiado ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate(`/grupo/${grupo.id}`)}
          className="rounded-md bg-neutral-900 py-2.5 text-sm font-medium text-white"
        >
          Ir al panel del grupo
        </button>
      </div>
    </div>
  );
}