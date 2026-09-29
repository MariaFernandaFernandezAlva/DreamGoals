import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import DreamGoals from "../../assets/DreamGoals.jpg";
import { Sparkles, CircleCheckBig, ArrowLeft } from "lucide-react";

export function CrearGrupoPage() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [cantidadIntegrantes, setCantidadIntegrantes] = useState(2);
  const [frecuencia, setFrecuencia] = useState(30);
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErrorMsg("");

    const { data: grupoId, error } = await supabase.rpc("crear_grupo", {
      p_nombre: nombre,
      p_cantidad_integrantes: cantidadIntegrantes,
      p_frecuencia_dias: frecuencia,
    });

    if (error) {
      setErrorMsg(error.message);
      setEnviando(false);
      return;
    }

    navigate(`/invitacion/${grupoId}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F9F8F5] font-sans text-neutral-900">
      {/* --- HEADER --- */}
      <header className="flex w-full items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-2 font-fraunces text-lg md:text-xl font-medium text-negro">
          <Sparkles className="h-6 w-6 text-azul" />
          DreamGoals
        </div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-neutral-600 transition-colors hover:text-[#008A8A]"
        >
          <ArrowLeft className="h-4 w-4"/>
          Volver al panel
        </button>
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
                Espacio compartido
              </span>
              <h2 className="font-serif text-[28px] font-bold leading-tight md:text-3xl lg:text-[34px]">
                Metas claras, ahorros compartidos y total tranquilidad.
              </h2>
            </div>
          </div>

          {/* Lado derecho (Formulario) */}
          <div className="flex h-full flex-col justify-center rounded-4xl bg-white p-8 shadow-xl md:p-10 lg:p-12">
            <form onSubmit={handleSubmit} className="flex flex-col gap-7">
              <div className="flex flex-col gap-2">
                <h1 className="font-serif text-3xl font-bold text-neutral-900">
                  Crea tu grupo
                </h1>
                <p className="text-sm leading-relaxed text-neutral-500">
                  Configura los detalles iniciales para comenzar a ahorrar
                  juntos.
                </p>
              </div>

              {/* Input: Nombre del grupo */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="nombre"
                  className="text-sm font-medium text-neutral-900"
                >
                  Nombre del grupo <span className="text-red-500">*</span>
                </label>
                <input
                  id="nombre"
                  required
                  placeholder="Ahorradores"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-xl bg-[#F6F5F0] px-4 py-4 text-sm text-neutral-800 outline-none border border-transparent transition-all focus:border-[#008A8A] focus:bg-white focus:ring-1 focus:ring-[#008A8A]"
                />
              </div>

              {/* Input: Cantidad de integrantes (Contador personalizado) */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-900">
                  Cantidad máxima de integrantes
                </label>
                <div className="flex items-center justify-between rounded-xl bg-[#F6F5F0] px-4 py-3">
                  <span className="text-sm text-neutral-600">
                    Personas permitidas:
                  </span>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        setCantidadIntegrantes((p) => Math.max(1, p - 1))
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg font-medium text-neutral-600 shadow-sm transition-colors hover:text-[#008A8A]"
                    >
                      -
                    </button>
                    <span className="w-4 text-center font-serif text-lg font-bold text-[#006666]">
                      {cantidadIntegrantes}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCantidadIntegrantes((p) => p + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-lg font-medium text-neutral-600 shadow-sm transition-colors hover:text-azul"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Radios: Frecuencia de conciliación */}
              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-neutral-900">
                  Frecuencia de conciliación
                </span>

                <label
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                    frecuencia === 14
                      ? "border-azul bg-teal-50/40 ring-1 ring-azul"
                      : "border-transparent bg-[#F6F5F0] hover:bg-[#F2EFE8]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${frecuencia === 14 ? "border-azul" : "border-neutral-400"}`}
                    >
                      {frecuencia === 14 && (
                        <div className="h-2.5 w-2.5 rounded-full bg-azul" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-neutral-900">
                      Cada 14 días
                    </span>
                  </div>
                  <input
                    type="radio"
                    className="hidden"
                    checked={frecuencia === 14}
                    onChange={() => setFrecuencia(14)}
                  />
                </label>

                <label
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                    frecuencia === 30
                      ? "border-[#008A8A] bg-teal-50/40 ring-1 ring-[#008A8A]"
                      : "border-transparent bg-[#F6F5F0] hover:bg-[#F2EFE8]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${frecuencia === 30 ? "border-[#008A8A]" : "border-neutral-400"}`}
                    >
                      {frecuencia === 30 && (
                        <div className="h-2.5 w-2.5 rounded-full bg-[#008A8A]" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-neutral-900">
                      Cada 30 días
                    </span>
                  </div>
                  {frecuencia === 30 && (
                    <span className="rounded-full bg-teal-100/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-800">
                      Predeterminado
                    </span>
                  )}
                  <input
                    type="radio"
                    className="hidden"
                    checked={frecuencia === 30}
                    onChange={() => setFrecuencia(30)}
                  />
                </label>
              </div>

              {errorMsg && (
                <p className="text-xs font-medium text-red-600">{errorMsg}</p>
              )}

              {/* Botones de Acción */}
              <div className="mt-2 flex flex-col gap-5">
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#008A8A] py-4 text-sm font-semibold text-white shadow-md transition-all hover:bg-teal-700 disabled:opacity-50"
                >
                  {!enviando && <CircleCheckBig className="h-4 w-4" />}
                  {enviando ? "Creando..." : "Crear grupo y generar link"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="text-center text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="flex w-full flex-col items-center justify-between gap-4 px-6 py-8 text-[11px] text-neutral-500 md:flex-row md:px-12 md:text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#006666]">DreamGoals</span>
          <span className="hidden text-neutral-300 sm:inline">•</span>
          <span className="hidden sm:inline">
            Espacio cálido para florecer en comunidad
          </span>
        </div>
        <div>© 2026 DreamGoals. Todos los derechos reservados.</div>
      </footer>
    </div>
  );
}
