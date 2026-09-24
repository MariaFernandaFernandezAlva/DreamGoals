import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../auth/AuthProvider';
import type { Grupo, Perfil } from '../../services/entities';

export function MisGruposPage() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [grupos, setGrupos] = useState<Grupo[] | null>(null);

  useEffect(() => {
    if (!user) return;

    // El nombre se guarda en "perfiles", no en el objeto de auth —
    // por eso hace falta esta consulta aparte.
    supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setPerfil(data));

    // Sin "where": RLS ya filtra a solo los grupos de este usuario.
    supabase
      .from('grupos')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setGrupos(data ?? []));
  }, [user]);

  async function handleLogout() {
    await supabase.auth.signOut();
    // El AuthProvider detecta el cambio de sesión solo y el
    // enrutador (en main.tsx) manda de vuelta al login.
  }

  if (!grupos) return null;

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs text-neutral-500">Hola,</p>
          <h1 className="text-lg font-bold">{perfil?.nombre ?? user?.email}</h1>
        </div>
        <button onClick={handleLogout} className="text-xs text-neutral-500 underline">
          Cerrar sesión
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Mis grupos</h2>
        <Link
          to="/crear-grupo"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          + Crear grupo
        </Link>
      </div>

      {grupos.length === 0 ? (
        <p className="text-sm text-neutral-400">
          Aún no perteneces a ningún grupo. Crea uno, o pide que te compartan un link de invitación.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {grupos.map((grupo) => (
            <Link
              key={grupo.id}
              to={`/grupo/${grupo.id}`}
              className="flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-5"
            >
              <span className="text-sm font-semibold">{grupo.nombre}</span>
              <span className="text-xs text-neutral-500">{grupo.cantidad_integrantes} integrantes máx.</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}