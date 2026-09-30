import { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import DreamGoals from "../../assets/DreamGoals.jpg";
import { Sparkles, CircleCheckBig, ArrowRight } from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  // "estado" controla qué le mostramos: el formulario, un mensaje
  // de éxito, o un error — así no necesitamos tres componentes distintos.
  const [estado, setEstado] = useState<'form' | 'enviando' | 'enviado' | 'error'>('form');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEstado('enviando');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
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
                Bienvenido de nuevo
              </span>
              <h2 className="font-serif text-[28px] font-bold leading-tight md:text-3xl lg:text-[34px]">
                Tu bitácora de ahorro grupal a un solo paso.
              </h2>
            </div>
          </div>

          {/* Lado derecho (Contenedor interactivo) */}
          <div className="flex h-full flex-col justify-center rounded-4xl bg-white p-8 shadow-xl md:p-10 lg:p-12">
            
            {estado === 'enviado' ? (
              // --- ESTADO: MENSAJE ENVIADO ---
              <div className="flex flex-col items-center justify-center gap-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-10 w-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold text-neutral-900">Revisa tu correo</h2>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                    Te hemos enviado un link de acceso seguro a <strong className="font-semibold text-neutral-800">{email}</strong>.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    Ábrelo desde este mismo dispositivo para entrar sin necesidad de contraseñas.
                  </p>
                </div>
              </div>
            ) : (
              // --- ESTADO: FORMULARIO ---
              <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-in fade-in duration-300">
                <div className="flex flex-col gap-2">
                  <h1 className="font-serif text-3xl font-bold text-neutral-900">Accede a tu cuenta</h1>
                  <p className="text-sm leading-relaxed text-neutral-500">
                    Bitácora de ahorro grupal. Recibirás un enlace seguro para entrar.
                  </p>
                </div>

                <div className="flex flex-col gap-5">
                  {/* Input: Nombre */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="nombre" className="text-sm font-medium text-neutral-900">
                        Nombre Completo
                      </label>
                      <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">
                        Solo si es tu primera vez
                      </span>
                    </div>
                    <input
                      id="nombre"
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Juan Perez"
                      className="w-full rounded-xl bg-[#F6F5F0] px-4 py-4 text-sm text-neutral-800 outline-none border border-transparent transition-all placeholder:text-neutral-400 focus:border-[#008A8A] focus:bg-white focus:ring-1 focus:ring-[#008A8A]"
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
                      className="w-full rounded-xl bg-[#F6F5F0] px-4 py-4 text-sm text-neutral-800 outline-none border border-transparent transition-all placeholder:text-neutral-400 focus:border-[#008A8A] focus:bg-white focus:ring-1 focus:ring-[#008A8A]"
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
                    disabled={estado === 'enviando'}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#008A8A] py-4 text-sm font-semibold text-white shadow-md transition-all hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {estado === 'enviando' ? 'Enviando link seguro...' : 'Enviar link de acceso'}
                    {estado !== 'enviando' && (
                      <ArrowRight className="h-4 w-4" strokeWidth={2}/>
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