import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import type { Meta } from "../../services/entities";
import { Check, ChevronDown, Plus, Trash2, X } from "lucide-react";

interface FilaMinimeta {
  id: string | null; // null = todavía no existe en la base de datos
  nombre: string;
  porcentaje: string;
  fecha_limite: string;
  premio: string;
  nota: string;
  abierto: boolean;
  eliminar: boolean; // marcada para borrar recién al guardar
}

function nuevaFila(): FilaMinimeta {
  return {
    id: null,
    nombre: "",
    porcentaje: "",
    fecha_limite: "",
    premio: "",
    nota: "",
    abierto: true,
    eliminar: false,
  };
}

const NOMBRES_AUTOMATICOS = [
  "Primer cuarto",
  "Mitad del camino",
  "Recta final",
  "¡Meta lograda!",
];
const PORCENTAJES_AUTOMATICOS = [25, 50, 75, 100];

function filasAutomaticas(): FilaMinimeta[] {
  return PORCENTAJES_AUTOMATICOS.map((p, i) => ({
    id: null,
    nombre: NOMBRES_AUTOMATICOS[i],
    porcentaje: String(p),
    fecha_limite: "",
    premio: "",
    nota: "",
    abierto: false,
    eliminar: false,
  }));
}

const inputClase =
  "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-azul focus:ring-2 focus:ring-azul/20 disabled:bg-neutral-50 disabled:text-neutral-400";

const labelClase = "text-xs text-neutral-500";

// Con más pasos que esto, las etiquetas de arriba del stepper se pisarían.
const MAX_ETIQUETAS_STEPPER = 4;

function formatearSoles(valor: number) {
  return `S/ ${valor.toLocaleString("es-PE")}`;
}

function InsigniaHito({
  cumplida,
  enCurso,
  numero,
}: {
  cumplida: boolean;
  enCurso: boolean;
  numero: number;
}) {
  if (cumplida) {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#006656] text-white">
        <Check className="h-4 w-4" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
        enCurso
          ? "border-azul text-azul"
          : "border-neutral-300 text-neutral-500"
      }`}
    >
      {numero}
    </span>
  );
}

export function MinimetasPage() {
  const { metaId } = useParams<{ metaId: string }>();
  const navigate = useNavigate();

  const [meta, setMeta] = useState<Meta | null>(null);
  const [acumulado, setAcumulado] = useState(0);
  const [modo, setModo] = useState<"automatica" | "manual">("manual");
  const [filas, setFilas] = useState<FilaMinimeta[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    supabase
      .from("metas")
      .select("*")
      .eq("id", metaId!)
      .single()
      .then(({ data }) => setMeta(data));

    // El acumulado decide qué minimetas ya están cumplidas — mismo
    // cálculo que usa el dashboard (depósitos menos retiros).
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

    supabase
      .from("minimetas")
      .select("*")
      .eq("meta_id", metaId!)
      .order("porcentaje", { ascending: true })
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        // Si las 4 filas guardadas coinciden exactamente con los
        // porcentajes automáticos, abrimos el modal ya en modo
        // "automática" — así se respeta lo que el usuario eligió
        // la última vez que guardó.
        const esAutomatica =
          data.length === 4 &&
          data.every(
            (m, i) => Number(m.porcentaje) === PORCENTAJES_AUTOMATICOS[i],
          );
        setModo(esAutomatica ? "automatica" : "manual");
        setFilas(
          data.map((m) => ({
            id: m.id,
            nombre: m.nombre,
            porcentaje: String(m.porcentaje),
            fecha_limite: m.fecha_limite ?? "",
            premio: m.premio,
            nota: m.nota ?? "",
            abierto: false,
            eliminar: false,
          })),
        );
      });
  }, [metaId]);

  function cerrar() {
    navigate(-1);
  }

  function esCumplida(fila: FilaMinimeta) {
    if (!meta || !fila.id || !fila.porcentaje) return false;
    const montoNecesario =
      (Number(fila.porcentaje) / 100) * meta.monto_objetivo;
    return acumulado >= montoNecesario;
  }

  function actualizarFila(index: number, cambios: Partial<FilaMinimeta>) {
    setFilas((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...cambios } : f)),
    );
  }

  function agregarFila() {
    // Colapsa las demás al agregar una nueva, para que el modal no
    // crezca sin control con varias minimetas abiertas a la vez.
    setFilas((prev) => [
      ...prev.map((f) => ({ ...f, abierto: false })),
      nuevaFila(),
    ]);
  }

  function quitarFila(index: number) {
    setFilas((prev) => {
      const fila = prev[index];
      // Si ya existe en la base de datos, se marca para borrar recién
      // al guardar — así "Cancelar" todavía puede deshacer el cambio.
      if (fila.id)
        return prev.map((f, i) => (i === index ? { ...f, eliminar: true } : f));
      // Si es nueva (nunca se guardó), se quita directo de la lista.
      return prev.filter((_, i) => i !== index);
    });
  }

  function cambiarAModo(nuevoModo: "automatica" | "manual") {
    if (configurado) return;
    if (nuevoModo === modo) return;
    setModo(nuevoModo);
    if (nuevoModo === "automatica") {
      setFilas(filasAutomaticas());
    } else {
      // Al pasar a manual arrancamos con una fila vacía en vez de
      // dejar el modal sin nada que editar.
      setFilas([nuevaFila()]);
    }
  }

  const visibles = filas.filter((f) => !f.eliminar);
  const configurado = filas.some((f) => f.id);
  const filasAutomaticaVisibles = visibles;
  const pasos = visibles
    .filter((f) => Number(f.porcentaje) > 0)
    .map((f) => {
      const porcentaje = Number(f.porcentaje);
      return {
        fila: f,
        porcentaje,
        monto: meta ? (porcentaje / 100) * meta.monto_objetivo : 0,
        cumplida: esCumplida(f),
      };
    })
    .sort((a, b) => a.porcentaje - b.porcentaje);

  const indiceEnCurso = pasos.findIndex((p) => !p.cumplida);
  const filaEnCurso = indiceEnCurso >= 0 ? pasos[indiceEnCurso].fila : null;
  const mostrarEtiquetas = pasos.length <= MAX_ETIQUETAS_STEPPER;

  function progresoTramo(i: number) {
    const actual = pasos[i];
    const siguiente = pasos[i + 1];
    if (siguiente.cumplida) return 100;
    if (!actual.cumplida) return 0;
    const distancia = siguiente.monto - actual.monto;
    if (distancia <= 0) return 0;
    return Math.max(
      0,
      Math.min(100, ((acumulado - actual.monto) / distancia) * 100),
    );
  }

  async function handleGuardar() {
    setErrorMsg("");

    for (const f of visibles) {
      if (!f.nombre.trim() || !f.porcentaje || !f.premio.trim()) {
        setErrorMsg("Cada minimeta necesita nombre, porcentaje y premio.");
        return;
      }
    }

    setGuardando(true);

    const aBorrar = filas.filter((f) => f.eliminar && f.id);
    const aActualizar = filas.filter((f) => !f.eliminar && f.id);
    const aCrear = filas.filter((f) => !f.eliminar && !f.id);

    for (const f of aBorrar) {
      const { error } = await supabase
        .from("minimetas")
        .delete()
        .eq("id", f.id!);
      if (error) {
        setErrorMsg(error.message);
        setGuardando(false);
        return;
      }
    }

    for (const f of aActualizar) {
      const { error } = await supabase
        .from("minimetas")
        .update({
          nombre: f.nombre,
          porcentaje: Number(f.porcentaje),
          fecha_limite: f.fecha_limite || null,
          premio: f.premio,
          nota: f.nota || null,
        })
        .eq("id", f.id!);
      if (error) {
        setErrorMsg(error.message);
        setGuardando(false);
        return;
      }
    }

    if (aCrear.length > 0) {
      const { error } = await supabase.from("minimetas").insert(
        aCrear.map((f) => ({
          meta_id: metaId!,
          nombre: f.nombre,
          porcentaje: Number(f.porcentaje),
          fecha_limite: f.fecha_limite || null,
          premio: f.premio,
          nota: f.nota || null,
        })),
      );
      if (error) {
        setErrorMsg(error.message);
        setGuardando(false);
        return;
      }
    }

    navigate(`/meta/${metaId}`, { replace: true });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={cerrar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* ---------- Encabezado fijo ---------- */}
        <div className="shrink-0 bg-neutral px-5 pb-5 pt-6 sm:px-7">
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 hover:bg-neutral-200/60 hover:text-neutral-600"
          >
            <X className="h-5 w-5" />
          </button>

          <h1 className="pr-10 font-fraunces text-2xl font-extrabold">
            Configurar Minimetas
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Establece hitos intermedios y celebra el progreso en grupo.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-neutral-200 bg-white p-1 text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => cambiarAModo("automatica")}
              disabled={configurado}
              className={`rounded-lg px-2 py-2.5 leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                modo === "automatica"
                  ? "border border-naranja bg-naranja/30 font-medium text-negro shadow-sm"
                  : "text-neutral-500"
              }`}
            >
              Automáticas (25/50/75/100%)
            </button>
            <button
              type="button"
              onClick={() => cambiarAModo("manual")}
              disabled={configurado}
              className={`rounded-lg px-2 py-2.5 leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                modo === "manual"
                  ? "border border-naranja bg-naranja/30 font-medium text-negro shadow-sm"
                  : "text-neutral-500"
              }`}
            >
              Definirlas manualmente
            </button>
          </div>

          {configurado ? (
            <p className="mt-3 text-xs text-neutral-400">
              El formato de minimetas ya fue definido y no se puede cambiar.
            </p>
          ) : (
            <p className="mt-3 text-xs text-amber-600">
              ⚠️ Elige con calma: una vez que guardes la configuración, el
              formato (automático o manual) ya no se puede cambiar.
            </p>
          )}
        </div>

        {/* ---------- Zona con scroll ---------- */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5 sm:px-7">
          {/* Stepper */}
          {pasos.length > 0 && (
            <div
              className={`flex items-center border-b border-neutral-100 pb-6 ${
                mostrarEtiquetas ? "pt-7" : ""
              }`}
            >
              {pasos.map((p, i) => {
                const estado = p.cumplida
                  ? "hecho"
                  : i === indiceEnCurso
                    ? "actual"
                    : "pendiente";
                const posicionEtiqueta =
                  i === 0
                    ? "left-0"
                    : i === pasos.length - 1
                      ? "right-0"
                      : "left-1/2 -translate-x-1/2";
                return (
                  <div
                    key={i}
                    className={`flex items-center ${
                      i < pasos.length - 1 ? "flex-1" : ""
                    }`}
                  >
                    <div className="relative shrink-0">
                      {mostrarEtiquetas && (
                        <span
                          className={`absolute bottom-full mb-2 flex items-center gap-1.5 whitespace-nowrap text-[11px] text-neutral-600 ${posicionEtiqueta}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              estado === "hecho"
                                ? "bg-[#006656]"
                                : estado === "actual"
                                  ? "bg-azul"
                                  : "bg-neutral-300"
                            }`}
                          />
                          {p.porcentaje}%
                          <span className="hidden sm:inline">
                            ({formatearSoles(p.monto)})
                          </span>
                        </span>
                      )}
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                          estado === "hecho"
                            ? "bg-[#006656] text-white"
                            : estado === "actual"
                              ? "bg-azul text-white ring-4 ring-azul/20"
                              : "bg-neutral-200 text-neutral-500"
                        }`}
                      >
                        {estado === "hecho" ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        ) : (
                          i + 1
                        )}
                      </div>
                    </div>
                    {i < pasos.length - 1 && (
                      <div className="mx-1.5 h-1 flex-1 overflow-hidden rounded-full bg-azul/15">
                        <div
                          className="h-full rounded-full bg-azul transition-all"
                          style={{ width: `${progresoTramo(i)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* --- MODO AUTOMÁTICA --- */}
          {modo === "automatica" && (
            <div className="flex flex-col gap-3">
              {filasAutomaticaVisibles.map((fila, index) => {
                const cumplida = esCumplida(fila);
                const enCurso = fila === filaEnCurso;
                const monto = meta
                  ? (Number(fila.porcentaje) / 100) * meta.monto_objetivo
                  : null;
                return (
                  <div
                    key={index}
                    className={`rounded-2xl border p-4 ${
                      cumplida
                        ? "border-emerald-200 bg-emerald-50"
                        : enCurso
                          ? "border-azul bg-white ring-1 ring-azul"
                          : "border-neutral-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <InsigniaHito
                        cumplida={cumplida}
                        enCurso={enCurso}
                        numero={index + 1}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          Hito {index + 1} · {fila.nombre}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {fila.porcentaje}%
                          {monto !== null && ` (${formatearSoles(monto)})`}
                        </p>
                      </div>
                      {cumplida ? (
                        <span className="shrink-0 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-700">
                          ¡Alcanzado!
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs text-neutral-400">
                          Calculado auto
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-col gap-1">
                      <label className={labelClase}>Premio al cumplirla</label>
                      <input
                        value={fila.premio}
                        disabled={cumplida}
                        onChange={(e) =>
                          actualizarFila(filas.indexOf(fila), {
                            premio: e.target.value,
                          })
                        }
                        placeholder="Ej: Cena especial en restaurante"
                        className={inputClase}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* --- MODO MANUAL --- */}
          {modo === "manual" && (
            <div className="flex flex-col gap-3">
              {filas.map((fila, index) => {
                if (fila.eliminar) return null;
                const cumplida = esCumplida(fila);
                const enCurso = fila === filaEnCurso;
                const numero = visibles.indexOf(fila) + 1;
                const monto =
                  meta && fila.porcentaje
                    ? (Number(fila.porcentaje) / 100) * meta.monto_objetivo
                    : null;
                return (
                  <div
                    key={fila.id ?? `nueva-${index}`}
                    className={`overflow-hidden rounded-2xl border ${
                      fila.abierto
                        ? "border-azul bg-white ring-1 ring-azul"
                        : cumplida
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-neutral-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 p-3 sm:p-4">
                      <button
                        type="button"
                        onClick={() =>
                          actualizarFila(index, { abierto: !fila.abierto })
                        }
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <InsigniaHito
                          cumplida={cumplida}
                          enCurso={enCurso}
                          numero={numero}
                        />
                        <span className="min-w-0 flex-1 wrap-break-words">
                          {fila.abierto ? (
                            <span className="font-fraunces text-base font-bold">
                              Minimeta {numero}
                              {enCurso && " (En curso)"}
                            </span>
                          ) : (
                            <>
                              <span className="text-sm font-medium">
                                Minimeta {numero}
                                {fila.porcentaje && ` · ${fila.porcentaje}%`}
                                {monto !== null &&
                                  ` (${formatearSoles(monto)})`}
                              </span>
                              {fila.premio && (
                                <span className="ml-2 text-xs text-neutral-500">
                                  — {fila.premio}
                                </span>
                              )}
                            </>
                          )}
                        </span>
                      </button>

                      {cumplida ? (
                        <span className="shrink-0 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-700">
                          Cumplida
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => quitarFila(index)}
                          aria-label="Eliminar minimeta"
                          className="shrink-0 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          actualizarFila(index, { abierto: !fila.abierto })
                        }
                        aria-label={fila.abierto ? "Contraer" : "Expandir"}
                        aria-expanded={fila.abierto}
                        className="shrink-0 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100"
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            fila.abierto ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {fila.abierto && (
                      <div className="flex flex-col gap-3 border-t border-neutral-100 p-4">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1.4fr_0.7fr_1.2fr]">
                          <div className="col-span-2 flex min-w-0 flex-col gap-1 sm:col-span-1">
                            <label className={labelClase}>Nombre</label>
                            <input
                              value={fila.nombre}
                              disabled={cumplida}
                              onChange={(e) =>
                                actualizarFila(index, {
                                  nombre: e.target.value,
                                })
                              }
                              className={inputClase}
                            />
                          </div>
                          <div className="flex min-w-0 flex-col gap-1">
                            <label className={labelClase}>Meta (%)</label>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={fila.porcentaje}
                              disabled={cumplida}
                              onChange={(e) =>
                                actualizarFila(index, {
                                  porcentaje: e.target.value,
                                })
                              }
                              className={inputClase}
                            />
                          </div>
                          <div className="flex min-w-0 flex-col gap-1">
                            <label className={labelClase}>Fecha límite</label>
                            <input
                              type="date"
                              value={fila.fecha_limite}
                              disabled={cumplida}
                              onChange={(e) =>
                                actualizarFila(index, {
                                  fecha_limite: e.target.value,
                                })
                              }
                              className={inputClase}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="flex min-w-0 flex-col gap-1">
                            <label className={labelClase}>
                              Premio al cumplirla
                            </label>
                            <input
                              value={fila.premio}
                              disabled={cumplida}
                              onChange={(e) =>
                                actualizarFila(index, {
                                  premio: e.target.value,
                                })
                              }
                              className={inputClase}
                            />
                          </div>
                          <div className="flex min-w-0 flex-col gap-1">
                            <label className={labelClase}>
                              Nota o motivación
                            </label>
                            <input
                              value={fila.nota}
                              disabled={cumplida}
                              onChange={(e) =>
                                actualizarFila(index, { nota: e.target.value })
                              }
                              className={inputClase}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={agregarFila}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 py-3 text-sm text-neutral-500 transition-colors hover:border-azul hover:text-azul"
              >
                <Plus className="h-4 w-4" />
                Agregar nueva minimeta
              </button>
            </div>
          )}
        </div>

        {/* ---------- Pie fijo ---------- */}
        <div className="shrink-0 border-t border-neutral-100 bg-white px-5 py-4 sm:px-7">
          {errorMsg && <p className="mb-3 text-xs text-red-600">{errorMsg}</p>}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={cerrar}
              className="rounded-xl px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="rounded-xl bg-azul px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#007A7E] disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Guardar configuración"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
