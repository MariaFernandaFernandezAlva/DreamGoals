import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import type { Meta } from "../../services/entities";

// Cerrar una meta tiene dos pasos:
//
// 1) "verificar": igual que una conciliación normal — declaras el
//    saldo real (lo que hay en el banco) + subes la captura. Si NO
//    coincide con lo acumulado en la app, se bloquea el cierre (para
//    evitar marcar como "completada" una meta que en la vida real
//    todavía no llegó al monto, por un movimiento que a alguien se
//    le olvidó registrar). Si coincide, se pasa al paso 2.
//
// 2) "cerrar": ya verificado, se sube la foto de evidencia del logro
//    + un comentario de cierre, y ahí sí se marca completada=true.
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
    // Si ya se guardó una conciliación de verificación (aunque haya
    // salido con diferencia), navegamos "hacia adelante" con replace
    // para forzar que el dashboard se refresque y todos los del
    // grupo vean el resultado. Si se cancela sin haber verificado
    // nada, un simple "volver atrás" es suficiente.
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
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-7"
      >
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute right-4 top-4 text-neutral-400"
        >
          ×
        </button>

        <div>
          <h1 className="text-lg font-bold">🎉 Cerrar meta</h1>
          <p className="text-xs text-neutral-500">
            {paso === "verificar"
              ? "Antes de cerrar, confirmemos que el monto acumulado coincide con la realidad."
              : "Verificado — ahora sube la evidencia final del logro."}
          </p>
        </div>

        {/* --- PASO 1: verificación tipo conciliación --- */}
        {paso === "verificar" && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">
                Saldo real en el banco (S/)
              </label>
              <input
                type="number"
                value={saldoDeclarado}
                onChange={(e) => setSaldoDeclarado(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">
                Captura de la app del banco
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onCapturaChange(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              {capturaPreviewUrl && (
                <img
                  src={capturaPreviewUrl}
                  alt="Vista previa"
                  className="mt-1 h-32 rounded-md object-cover"
                />
              )}
            </div>

            {diferencia !== null && diferencia !== 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                ⚠ No coincide: declaraste S/{" "}
                {Number(saldoDeclarado).toLocaleString()}, pero la app calcula
                S/ {acumulado.toLocaleString()} (diferencia de S/{" "}
                {Math.abs(diferencia).toLocaleString()}). Registra el depósito o
                retiro que falte y vuelve a intentar cerrar la meta.
                {capturaPreviewUrl && (
                  <a
                    href={capturaPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 font-medium underline"
                  >
                    Ver captura
                  </a>
                )}
              </div>
            )}

            {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}

            <button
              type="button"
              onClick={handleVerificar}
              disabled={verificando}
              className="rounded-md bg-neutral-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {verificando ? "Verificando..." : "Verificar monto"}
            </button>
          </>
        )}

        {/* --- PASO 2: foto de cierre + comentario --- */}
        {paso === "cerrar" && (
          <>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              ✓ El monto declarado coincide con lo acumulado (S/{" "}
              {acumulado.toLocaleString()}).
              {capturaPreviewUrl && (
                <a
                  href={capturaPreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 font-medium underline"
                >
                  Ver captura
                </a>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">
                Foto del objetivo logrado
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onFotoChange(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              {fotoPreviewUrl && (
                <img
                  src={fotoPreviewUrl}
                  alt="Vista previa"
                  className="mt-1 h-32 rounded-md object-cover"
                />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">
                Comentario de cierre
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={3}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>

            {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}

            <button
              type="button"
              onClick={handleGuardarCierre}
              disabled={guardando}
              className="rounded-md bg-emerald-700 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {guardando
                ? "Cerrando meta..."
                : "🎉 Marcar meta como completada"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
