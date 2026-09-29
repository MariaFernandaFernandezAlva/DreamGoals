import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from './AuthProvider';
import DreamGoals from "../../assets/DreamGoals.jpg";
import { Sparkles, CircleCheckBig, ArrowLeft } from "lucide-react";

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

  return (
    <div className="flex min-h-screen flex-col bg-[#F9F8F5] font-sans text-neutral-900">
      {/* --- HEADER --- */}
      <header className="flex w-full items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-2 font-fraunces text-lg md:text-xl font-medium text-negro">
          <Sparkles className="h-6 w-6 text-azul" />
          DreamGoals
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex w-full flex-1 items-center justify-center p-4 md:p-8">
        <div className="grid w-full max-w-275 grid-cols-1 items-stretch gap-8 lg:grid-cols-2 lg:gap-12">
          
          {/* Lado izquierdo (Imagen decorativa) */}
          <div className="relative hidden h-full min-h-150 w-full flex-col justify-end overflow-hidden rounded-4xl bg-neutral-200 shadow-lg lg:flex">
            <img
              src={DreamGoals}
              alt="Personas ahorrando juntas"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent"></div>
            
            <div className="relative z-10 flex flex-col items-start p-10 text-white">
              <span className="mb-4 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                Suma fuerzas
              </span>
              <h2 className="font-serif text-[28px] font-bold leading-tight md:text-3xl lg:text-[34px]">
                Te han invitado a ser parte de una nueva meta en equipo.
              </h2>
            </div>
          </div>

          {/* Lado derecho (Contenedor interactivo) */}
          <div className="flex h-full flex-col justify-center rounded-4xl bg-white p-8 shadow-xl md:p-10 lg:p-12">
            
            {codigoInvalido ? (
              // --- ESTADO: CÓDIGO INVÁLIDO ---
              <div className="flex flex-col items-center justify-center gap-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-10 w-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold text-neutral-900">Enlace no válido</h2>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                    Este link de invitación no es válido o ya ha expirado. Pídele al administrador del grupo que genere uno nuevo.
                  </p>
                </div>
              </div>
            ) : uniendose ? (
              // --- ESTADO: UNIÉNDOSE (LOADING) ---
              <div className="flex flex-col items-center justify-center gap-6 text-center animate-in fade-in duration-300">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-12 w-12 animate-spin text-[#008A8A]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                <div>
                  <h2 className="font-serif text-xl font-bold text-neutral-900">Uniéndote al grupo...</h2>
                  <p className="mt-2 text-sm text-neutral-500">Preparando tu espacio de ahorro.</p>
                </div>
              </div>
            ) : estado === 'enviado' ? (
              // --- ESTADO: LINK ENVIADO AL CORREO ---
              <div className="flex flex-col items-center justify-center gap-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-10 w-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold text-neutral-900">Revisa tu correo</h2>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                    Te enviamos un link de acceso seguro a <strong className="font-semibold text-neutral-800">{email}</strong>.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    Ábrelo desde este mismo dispositivo para unirte al grupo.
                  </p>
                </div>
              </div>
            ) : (
              // --- ESTADO: FORMULARIO PRINCIPAL ---
              <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-in fade-in duration-300">
                
                <div className="flex flex-col gap-2">
                  <h1 className="font-serif text-3xl font-bold text-neutral-900">Únete al grupo</h1>
                  <p className="text-sm leading-relaxed text-neutral-500">
                    Ingresa para aceptar la invitación y comenzar a ahorrar.
                  </p>
                </div>

                {/* Banner del Grupo Invitado */}
                {nombreGrupo ? (
                  <div className="flex items-center gap-4 rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100/80 text-teal-700">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-6 w-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600">Te han invitado a</span>
                      <span className="font-serif text-lg font-bold text-neutral-900">{nombreGrupo}</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-21 w-full animate-pulse rounded-2xl bg-neutral-100"></div> // Skeleton loading
                )}

                <div className="flex flex-col gap-5">
                  {/* Input: Nombre */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="nombre" className="text-sm font-medium text-neutral-900">
                        Nombre
                      </label>
                      <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                        Solo si es tu primera vez
                      </span>
                    </div>
                    <input
                      id="nombre"
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Paolo"
                      className="w-full rounded-xl border border-transparent bg-[#F6F5F0] px-4 py-4 text-sm text-neutral-800 transition-all placeholder:text-neutral-400 focus:border-[#008A8A] focus:bg-white focus:ring-1 focus:ring-[#008A8A] outline-none"
                    />
                  </div>

                  {/* Input: Correo electrónico */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-sm font-medium text-neutral-900">
                      Correo electrónico <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                      className="w-full rounded-xl border border-transparent bg-[#F6F5F0] px-4 py-4 text-sm text-neutral-800 transition-all placeholder:text-neutral-400 focus:border-[#008A8A] focus:bg-white focus:ring-1 focus:ring-[#008A8A] outline-none"
                    />
                  </div>
                </div>

                {estado === 'error' && (
                  <div className="rounded-lg bg-red-50 p-3">
                    <p className="text-center text-xs font-medium text-red-600">{errorMsg}</p>
                  </div>
                )}

                {/* Botón de Acción */}
                <div className="mt-2 flex flex-col gap-4">
                  <button
                    type="submit"
                    disabled={estado === 'enviando' || !nombreGrupo}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#008A8A] py-4 text-sm font-semibold text-white shadow-md transition-all hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {estado === 'enviando' ? 'Enviando link seguro...' : 'Enviar link de acceso'}
                    {estado !== 'enviando' && (
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    )}
                  </button>
                  
                  <p className="text-center text-xs text-neutral-400">
                    Te llegará un enlace por correo, sin necesidad de contraseña.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="flex w-full flex-col items-center justify-between gap-4 px-6 py-8 text-[11px] text-neutral-500 md:flex-row md:px-12 md:text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#006666]">DreamGoals</span> 
          <span className="hidden text-neutral-300 sm:inline">•</span> 
          <span className="hidden sm:inline">Espacio cálido para florecer en comunidad</span>
        </div>
        <div>
          © 2026 DreamGoals. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}