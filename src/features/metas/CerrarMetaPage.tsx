import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import type { Meta } from "../../services/entities";

type Paso = "verificar" | "cerrar";

export function CerrarMetaPage() {
  const { metaId } = useParams<{ metaId: string }>();
  const navigate = useNavigate();

  const [meta, setMeta] = useState<Meta | null>(null);
  const [acumulado, setAcumulado] = useState(0);
  const [paso, setPaso] = useState<Paso>("verificar");
  const [errorMsg, setErrorMsg] = useState("");

  // --- Paso 1: verificación ---
  const [saldoDeclarado, setSaldoDeclarado] = useState("");
  const [capturaFile, setCapturaFile] = useState<File | null>(null);
  const [capturaPreviewUrl, setCapturaPreviewUrl] = useState<string | null>(
    null,
  );
  const [verificando, setVerificando] = useState(false);
  const [diferencia, setDiferencia] = useState<number | null>(null);
  // true en cuanto se guarda una conciliación de verificación (haya
  // coincidido o no) — a partir de ahí, cerrar el modal ya no puede
  // ser un simple "volver atrás", porque el dashboard necesita
  // refrescarse para mostrar lo que se acaba de guardar.
  const [seGuardoAlgo, setSeGuardoAlgo] = useState(false);

  // --- Paso 2: cierre ---
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(null);
  const [comentario, setComentario] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    supabase
      .from("metas")
      .select("*")
      .eq("id", metaId!)
      .single()
      .then(({ data }) => setMeta(data));

    supabase
      .from("transacciones")
      .select("tipo, monto")
      .eq("meta_id", metaId!)
      .then(({ data }) => {
        const total = (data ?? []).reduce(
          (t, x) => t + (x.tipo === "deposito" ? x.monto : -x.monto),
          0,
        );
        setAcumulado(total);
      });
  }, [metaId]);

  function cerrar() {
    if (seGuardoAlgo) {
      navigate(`/meta/${metaId}`, { replace: true });
    } else {
      navigate(-1);
    }
  }

  function onCapturaChange(file: File | null) {
    setCapturaFile(file);
    setCapturaPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  function onFotoChange(file: File | null) {
    setFotoFile(file);
    setFotoPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function handleVerificar() {
    setErrorMsg("");
    if (!saldoDeclarado || !capturaFile) {
      setErrorMsg("Ingresa el saldo real y sube la captura del banco.");
      return;
    }
    setVerificando(true);

    const extension = capturaFile.name.split(".").pop();
    const path = `conciliaciones/${metaId}-cierre-${Date.now()}.${extension}`;
    const { error: errorSubida } = await supabase.storage
      .from("evidencias")
      .upload(path, capturaFile);
    if (errorSubida) {
      setErrorMsg(errorSubida.message);
      setVerificando(false);
      return;
    }

    const declarado = Number(saldoDeclarado);
    const diff = declarado - acumulado;
    const resuelto = diff === 0;

    const { data: userData } = await supabase.auth.getUser();

    const { error: errorInsert } = await supabase
      .from("conciliaciones")
      .insert({
        meta_id: metaId!,
        usuario_id: userData.user!.id,
        fecha: new Date().toISOString().slice(0, 10),
        saldo_declarado: declarado,
        captura_url: path,
        resuelto,
      });
    if (errorInsert) {
      setErrorMsg(errorInsert.message);
      setVerificando(false);
      return;
    }

    setDiferencia(diff);
    setVerificando(false);
    setSeGuardoAlgo(true);
    if (resuelto) setPaso("cerrar");
  }

  async function handleGuardarCierre() {
    setErrorMsg("");
    if (!fotoFile || !comentario.trim()) {
      setErrorMsg("Sube una foto y escribe un comentario de cierre.");
      return;
    }
    setGuardando(true);

    const extension = fotoFile.name.split(".").pop();
    const path = `metas/${metaId}-cierre-${Date.now()}.${extension}`;
    const { error: errorSubida } = await supabase.storage
      .from("evidencias")
      .upload(path, fotoFile);
    if (errorSubida) {
      setErrorMsg(errorSubida.message);
      setGuardando(false);
      return;
    }

    const { error: errorUpdate } = await supabase.rpc("cerrar_meta", {
      p_meta_id: metaId!,
      p_imagen_cierre_url: path,
      p_comentario_cierre: comentario,
    });
    if (errorUpdate) {
      setErrorMsg(errorUpdate.message);
      setGuardando(false);
      return;
    }

    navigate(`/grupo/${meta!.grupo_id}`, { replace: true });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={cerrar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[95vh] w-full max-w-md flex-col gap-6 overflow-y-auto rounded-4xl bg-[#FAFAF7] p-8 shadow-2xl [&::-webkit-scrollbar]:hidden"
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute right-6 top-6 text-neutral-400 transition-colors hover:text-neutral-600"
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${paso === 'verificar' ? 'bg-naranja/20 text-njoscuro' : 'bg-naranja/20 text-njoscuro'}`}>
            {paso === 'verificar' ? (
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            ) : (
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            )}
          </div>
          <div>
            <h1 className="font-fraunces text-2xl font-bold text-neutral-900">
              Cerrar meta
            </h1>
            <p className="mt-0.5 text-xs font-medium text-neutral-500">
              {paso === "verificar" ? "Paso 1: Verificación" : "Paso 2: Celebración"}
            </p>
          </div>
        </div>
        
        <p className="text-sm leading-relaxed text-neutral-500">
          {paso === "verificar"
            ? "Antes de cerrar, confirmemos que el monto acumulado coincide con la realidad de tu cuenta bancaria."
            : "¡Verificado! Ahora sube la evidencia final del logro para completar la meta."}
        </p>

        {/* --- PASO 1: verificación tipo conciliación --- */}
        {paso === "verificar" && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-300">
            
            {/* Saldo real */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wide text-neutral-700">
                  Saldo real en el banco
                </label>
                <span className="rounded-full bg-cyan-50/80 px-2.5 py-1 text-[10px] font-semibold text-cyan-700">
                  Soles (PEN)
                </span>
              </div>
              <div className="flex overflow-hidden rounded-xl border border-neutral-200 bg-white transition-colors focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500">
                <div className="flex items-center justify-center bg-cyan-50/50 px-4 text-sm font-bold text-teal-700">
                  S/
                </div>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={saldoDeclarado}
                  onChange={(e) => setSaldoDeclarado(e.target.value)}
                  className="w-full bg-transparent px-3 py-3.5 text-sm text-neutral-800 placeholder-neutral-300 outline-none"
                />
              </div>
            </div>

            {/* Captura de app */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wide text-neutral-700">
                  Captura de la app del banco
                </label>
                <span className="text-xs font-medium text-neutral-400">Obligatorio</span>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-1.5 shadow-sm">
                <div className="flex items-center justify-between rounded-xl border border-neutral-200/60 bg-[#F9F7F2] px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-neutral-800">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5 text-teal-700">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <span className="max-w-35 truncate font-medium">
                      {capturaFile?.name || 'Sin archivo'}
                    </span>
                  </div>
                  <label className="cursor-pointer text-sm font-semibold text-[#008A8A] transition-colors hover:text-teal-800">
                    {capturaFile ? 'Cambiar' : 'Subir foto'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onCapturaChange(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>

                {capturaPreviewUrl && (
                  <div className="relative mt-1.5 flex h-40 w-full items-center justify-center overflow-hidden rounded-xl bg-[#EBE7DF]/30 p-2">
                    <img src={capturaPreviewUrl} alt="Vista previa" className="h-full w-auto max-w-full rounded-lg object-contain shadow-sm" />
                    <span className="absolute bottom-2 right-2 rounded-md bg-white/90 px-2 py-1 text-[10px] font-semibold text-neutral-600 shadow-sm backdrop-blur-sm">
                      Vista previa
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Diferencia Alerta */}
            {diferencia !== null && diferencia !== 0 && (
              <div className="flex flex-col gap-2 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4">
                <div className="flex items-center gap-2 text-amber-800">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-bold text-sm">Montos no coinciden</span>
                </div>
                <p className="text-sm leading-relaxed text-amber-900/80">
                  Declaraste S/ {Number(saldoDeclarado).toLocaleString()}, pero la app calcula S/ {acumulado.toLocaleString()} 
                  (diferencia de <strong className="font-semibold">S/ {Math.abs(diferencia).toLocaleString()}</strong>). 
                  Registra el depósito o retiro que falte y vuelve a intentar.
                </p>
                {capturaPreviewUrl && (
                  <a href={capturaPreviewUrl} target="_blank" rel="noreferrer" className="mt-1 w-fit text-sm font-semibold text-amber-700 underline decoration-amber-700/30 underline-offset-4 transition-colors hover:text-amber-900">
                    Ver captura enviada
                  </a>
                )}
              </div>
            )}

            {errorMsg && <p className="text-center text-xs font-medium text-red-600">{errorMsg}</p>}

            {/* Botones de acción Paso 1 */}
            <div className="mt-2 flex flex-col gap-4">
              <button
                type="button"
                onClick={handleVerificar}
                disabled={verificando}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#008A8A] py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-teal-700 disabled:opacity-50"
              >
                {!verificando && (
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {verificando ? "Verificando..." : "Verificar monto"}
              </button>
              <button
                type="button"
                onClick={cerrar}
                className="w-full text-center text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* --- PASO 2: foto de cierre + comentario --- */}
        {paso === "cerrar" && (
          <div className="flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-300">
            
            {/* Mensaje de éxito de validación */}
            <div className="flex flex-col gap-2 rounded-2xl border border-emerald-200/80 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-bold text-sm">¡Montos validados!</span>
              </div>
              <p className="text-sm leading-relaxed text-emerald-900/80">
                El monto declarado coincide con lo acumulado (<strong className="font-semibold">S/ {acumulado.toLocaleString()}</strong>).
              </p>
              {capturaPreviewUrl && (
                <a href={capturaPreviewUrl} target="_blank" rel="noreferrer" className="mt-1 w-fit text-sm font-semibold text-emerald-700 underline decoration-emerald-700/30 underline-offset-4 transition-colors hover:text-emerald-900">
                  Ver captura enviada
                </a>
              )}
            </div>

            {/* Foto del logro */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wide text-neutral-700">
                  Foto del objetivo logrado
                </label>
                <span className="text-xs font-medium text-neutral-400">Obligatorio</span>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-1.5 shadow-sm">
                <div className="flex items-center justify-between rounded-xl border border-neutral-200/60 bg-[#F9F7F2] px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-neutral-800">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5 text-teal-700">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                    <span className="max-w-[140px] truncate font-medium">
                      {fotoFile?.name || 'Sin archivo'}
                    </span>
                  </div>
                  <label className="cursor-pointer text-sm font-semibold text-[#008A8A] transition-colors hover:text-teal-800">
                    {fotoFile ? 'Cambiar' : 'Subir foto'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onFotoChange(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>

                {fotoPreviewUrl && (
                  <div className="relative mt-1.5 flex h-40 w-full items-center justify-center overflow-hidden rounded-xl bg-[#EBE7DF]/30 p-2">
                    <img src={fotoPreviewUrl} alt="Vista previa" className="h-full w-auto max-w-full rounded-lg object-contain shadow-sm" />
                    <span className="absolute bottom-2 right-2 rounded-md bg-white/90 px-2 py-1 text-[10px] font-semibold text-neutral-600 shadow-sm backdrop-blur-sm">
                      Vista previa
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Comentario final */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wide text-neutral-700">
                Comentario de cierre
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={3}
                placeholder="¡Lo logramos! Listo para la compra..."
                className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-sm text-neutral-800 placeholder-neutral-400 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {errorMsg && <p className="text-center text-xs font-medium text-red-600">{errorMsg}</p>}

            {/* Botones de acción Paso 2 */}
            <div className="mt-2 flex flex-col gap-4">
              <button
                type="button"
                onClick={handleGuardarCierre}
                disabled={guardando}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-azul py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-emerald-700 disabled:opacity-50"
              >
                {!guardando && (
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                  </svg>
                )}
                {guardando ? "Cerrando meta..." : "Marcar meta como completada"}
              </button>
              <button
                type="button"
                onClick={cerrar}
                className="w-full text-center text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}