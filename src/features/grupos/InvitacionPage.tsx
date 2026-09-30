import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import type { Grupo } from '../../services/entities';
import DreamGoals from "../../assets/DreamGoals.jpg";
import { Sparkles } from "lucide-react";

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
              <span className="mb-4 flex items-center gap-1.5 rounded-full bg-teal-500/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-teal-50 backdrop-blur-md">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-3 w-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Paso completado
              </span>
              <h2 className="font-serif text-[28px] font-bold leading-tight md:text-3xl lg:text-[34px]">
                ¡Todo listo! Es momento de invitar a tu equipo.
              </h2>
            </div>
          </div>

          {/* Lado derecho (Contenedor interactivo) */}
          <div className="flex h-full flex-col justify-center rounded-4xl bg-white p-8 shadow-xl md:p-10 lg:p-12">
            <div className="flex flex-col gap-8 animate-in fade-in duration-300">
              
              {/* Encabezado y Check de Éxito */}
              <div className="flex flex-col gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-7 w-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-teal-600">✓ Grupo creado</p>
                  <h1 className="mt-1 font-serif text-3xl font-bold text-neutral-900">{grupo.nombre}</h1>
                </div>
              </div>

              {/* Tarjetas de Estadísticas */}
              <div className="flex gap-4">
                <div className="flex flex-1 flex-col gap-1 rounded-2xl border border-neutral-100 bg-[#F6F5F0]/60 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Integrantes máx.</p>
                  <p className="text-xl font-bold text-neutral-800">{grupo.cantidad_integrantes}</p>
                </div>
                <div className="flex flex-1 flex-col gap-1 rounded-2xl border border-neutral-100 bg-[#F6F5F0]/60 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Conciliación</p>
                  <p className="text-xl font-bold text-neutral-800">Cada {grupo.frecuencia_conciliacion_dias} días</p>
                </div>
              </div>

              {/* Sección del Link */}
              <div className="flex flex-col gap-3">
                <label htmlFor="link" className="text-sm font-medium text-neutral-900">
                  Link de invitación
                </label>
                <div className="flex items-center gap-2 rounded-xl bg-[#F6F5F0] p-1.5 pr-2 transition-colors focus-within:ring-1 focus-within:ring-[#008A8A]">
                  <input 
                    id="link" 
                    readOnly 
                    value={link} 
                    className="w-full bg-transparent px-3 py-2 text-sm text-neutral-600 outline-none" 
                  />
                  <button 
                    onClick={copiarLink} 
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all ${
                      copiado 
                        ? 'bg-teal-100 text-teal-700' 
                        : 'bg-white text-neutral-700 shadow-sm hover:bg-neutral-50'
                    }`}
                  >
                    {copiado ? (
                      <>
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-3.5 w-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Copiado
                      </>
                    ) : (
                      <>
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-3.5 w-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                        </svg>
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Botón de Navegación */}
              <div className="mt-2">
                <button
                  onClick={() => navigate(`/grupo/${grupo.id}`)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#008A8A] py-4 text-sm font-semibold text-white shadow-md transition-all hover:bg-teal-700"
                >
                  Ir al panel del grupo
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>

            </div>
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