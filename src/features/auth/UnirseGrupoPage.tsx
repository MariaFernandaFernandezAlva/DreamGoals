import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from './AuthProvider';

export function UnirseGrupoPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Datos del grupo, para el banner "Te invitaron a..."
  const [nombreGrupo, setNombreGrupo] = useState<string | null>(null);
  const [codigoInvalido, setCodigoInvalido] = useState(false);

  // Estado del formulario de correo (igual que en LoginPage).
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [estado, setEstado] = useState<'form' | 'enviando' | 'enviado' | 'error'>('form');
  const [errorMsg, setErrorMsg] = useState('');

  // Evita llamar a unirse_a_grupo más de una vez si el efecto
  // se vuelve a disparar (por ejemplo, por StrictMode en desarrollo).
  const [uniendose, setUniendose] = useState(false);

  // 1. Apenas carga la página, busca el nombre del grupo para
  //    mostrarlo en el banner — esto funciona sin estar logueado.
  useEffect(() => {
    supabase
      .rpc('obtener_grupo_por_invite_code', { p_invite_code: codigo! })
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          setCodigoInvalido(true);
          return;
        }
        setNombreGrupo(data[0].nombre);
      });
  }, [codigo]);

  // 2. Si en algún momento hay sesión iniciada (ya sea porque
  //    volviste del link mágico, o porque ya estabas logueado),
  //    únete al grupo automáticamente y entra al panel.
  useEffect(() => {
    if (authLoading || !user || uniendose) return;

    setUniendose(true);
    supabase
      .rpc('unirse_a_grupo', { p_invite_code: codigo! })
      .then(({ data: grupoId, error }) => {
        if (error) {
          setErrorMsg(error.message);
          setUniendose(false);
          return;
        }
        navigate(`/grupo/${grupoId}`);
      });
  }, [authLoading, user, uniendose, codigo, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEstado('enviando');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Clave: vuelve a ESTA misma página de invitación, no a "/".
        emailRedirectTo: `${window.location.origin}/unirse/${codigo}`,
        data: nombre ? { nombre } : undefined,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setEstado('error');
      return;
    }

    setEstado('enviado');
  }

  if (codigoInvalido) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100 px-4">
        <p className="text-sm text-neutral-600">Este link de invitación no es válido o ya expiró.</p>
      </div>
    );
  }

  if (uniendose) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100 px-4">
        <p className="text-sm text-neutral-600">Uniéndote al grupo...</p>
      </div>
    );
  }

  if (estado === 'enviado') {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-100 px-4">
        <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">
            Te enviamos un link de acceso a <strong>{email}</strong>. Ábrelo desde el mismo dispositivo para unirte.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-neutral-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-8"
      >
        <div className="text-center">
          <h1 className="text-lg font-bold">DreamGoals</h1>
          <p className="mt-1 text-sm text-neutral-500">Bitácora de ahorro grupal</p>
        </div>

        {nombreGrupo && (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-xs text-neutral-500">Te invitaron a unirte a</p>
            <p className="text-sm font-semibold">Grupo: {nombreGrupo}</p>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="nombre" className="text-xs text-neutral-500">Nombre (solo si es tu primera vez)</label>
          <input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-xs text-neutral-500">Correo electrónico</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        {estado === 'error' && <p className="text-xs text-red-600">{errorMsg}</p>}

        <button
          type="submit"
          disabled={estado === 'enviando'}
          className="rounded-md bg-neutral-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {estado === 'enviando' ? 'Enviando...' : 'Enviar link de acceso'}
        </button>
      </form>
    </div>
  );
}