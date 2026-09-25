import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import type { Meta } from "../../services/entities";

// Representa una fila del formulario — no es exactamente el tipo
// Minimeta de la base de datos porque mientras se edita, los valores
// numéricos viven como texto (para no pelear con inputs vacíos), y
// hay campos extra (abierto, eliminar) que solo existen en pantalla.
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

// Nombres fijos para el modo automático — el usuario solo puede
// personalizar el premio de cada uno, no el nombre ni el porcentaje.
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

  // Una minimeta recién agregada (todavía sin guardar) nunca se
  // muestra como "cumplida" — no tendría sentido bloquear la edición
  // de algo que ni siquiera se guardó todavía.
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
    // Una vez que ya hay minimetas guardadas (alguna fila con id),
    // el formato queda fijo — no se puede saltar de automático a
    // manual ni viceversa. Los botones ya quedan disabled en el
    // render, esto es un segundo seguro.
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
  const porcentajeTotal = visibles.reduce(
    (t, f) => t + (Number(f.porcentaje) || 0),
    0,
  );
  // El formato (automático vs manual) se define una sola vez: la
  // primera vez que se guarda algo, ya no se puede cambiar.
  const configurado = filas.some((f) => f.id);
  // Igual que "visibles", pero es el nombre que usa el bloque
  // automático — mismo contenido, filas sin las marcadas "eliminar".
  const filasAutomaticaVisibles = visibles;

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
          <h1 className="text-lg font-bold">Configurar minimetas</h1>
          <p className="text-xs text-neutral-500">
            Establece hitos intermedios y celebra el progreso en grupo.
          </p>
        </div>

        <div className="flex gap-2 rounded-lg bg-neutral-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => cambiarAModo("automatica")}
            disabled={configurado}
            className={`flex-1 rounded-md py-2 disabled:cursor-not-allowed disabled:opacity-60 ${modo === "automatica" ? "bg-white font-medium shadow-sm" : "text-neutral-500"}`}
          >
            Automáticas (25/50/75/100%)
          </button>
          <button
            type="button"
            onClick={() => cambiarAModo("manual")}
            disabled={configurado}
            className={`flex-1 rounded-md py-2 disabled:cursor-not-allowed disabled:opacity-60 ${modo === "manual" ? "bg-white font-medium shadow-sm" : "text-neutral-500"}`}
          >
            Definirlas manualmente
          </button>
        </div>
        {configurado && (
          <p className="-mt-2 text-xs text-neutral-400">
            El formato de minimetas ya fue definido y no se puede cambiar.
          </p>
        )}
        {!configurado && (
          <p className="-mt-2 text-xs text-amber-600">
            ⚠️ Elige con calma: una vez que guardes la configuración, el formato
            (automático o manual) ya no se puede cambiar.
          </p>
        )}

        {/* --- MODO AUTOMÁTICA: stepper con los 4 hitos fijos --- */}
        {modo === "automatica" && (
          <>
            <div className="flex items-center">
              {PORCENTAJES_AUTOMATICOS.map((p, i) => {
                // Se usa la lista ya sin las filas marcadas "eliminar"
                // (restos del modo anterior) para que el índice i
                // siga correspondiendo al hito correcto.
                const fila = filasAutomaticaVisibles[i];
                const cumplida = fila ? esCumplida(fila) : false;
                return (
                  <div key={p} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                          cumplida
                            ? "bg-emerald-600 text-white"
                            : "border-2 border-neutral-300 text-neutral-400"
                        }`}
                      >
                        {cumplida ? "✓" : i + 1}
                      </div>
                      <span className="text-[11px] text-neutral-500">
                        {p}%
                        {meta &&
                          ` (S/ ${((p / 100) * meta.monto_objetivo).toLocaleString()})`}
                      </span>
                    </div>
                    {i < PORCENTAJES_AUTOMATICOS.length - 1 && (
                      <div
                        className={`mx-1 h-0.5 flex-1 ${cumplida ? "bg-emerald-600" : "bg-neutral-200"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2">
              {filasAutomaticaVisibles.map((fila, index) => {
                const cumplida = esCumplida(fila);
                return (
                  <div
                    key={index}
                    className={`rounded-lg border p-3 ${cumplida ? "border-emerald-200 bg-emerald-50" : "border-neutral-200"}`}
                  >
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium">
                        Hito {index + 1} · {fila.nombre}
                        <span className="ml-1 text-neutral-400">
                          {fila.porcentaje}%
                          {meta &&
                            ` (S/ ${((Number(fila.porcentaje) / 100) * meta.monto_objetivo).toLocaleString()})`}
                        </span>
                      </span>
                      {cumplida ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                          ¡Alcanzado!
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">
                          Calculado auto
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-neutral-500">
                        Premio al cumplirla
                      </label>
                      <input
                        value={fila.premio}
                        disabled={cumplida}
                        // ojo: "index" aquí es la posición dentro de
                        // filasAutomaticaVisibles, no dentro de "filas"
                        // (que puede traer filas ocultas por delante) —
                        // por eso se busca la posición real con indexOf.
                        onChange={(e) =>
                          actualizarFila(filas.indexOf(fila), {
                            premio: e.target.value,
                          })
                        }
                        placeholder="Ej: Cena especial en restaurante"
                        className="rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-white/50"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* --- MODO MANUAL: acordeón con filas libres --- */}
        {modo === "manual" && (
          <>
            <div>
              <div className="mb-1 flex justify-between text-xs text-neutral-500">
                <span>Suma de minimetas</span>
                <span>{porcentajeTotal}%</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-emerald-600"
                  style={{ width: `${Math.min(100, porcentajeTotal)}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {filas.map((fila, index) => {
                if (fila.eliminar) return null;
                const cumplida = esCumplida(fila);
                return (
                  <div
                    key={fila.id ?? `nueva-${index}`}
                    className="rounded-lg border border-neutral-200"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        actualizarFila(index, { abierto: !fila.abierto })
                      }
                      className="flex w-full items-center justify-between p-3 text-left text-sm"
                    >
                      <span className="flex items-center gap-2">
                        {cumplida && (
                          <span className="text-emerald-600">✓</span>
                        )}
                        <span className="font-medium">
                          {fila.nombre || `Minimeta ${index + 1}`}
                        </span>
                        {fila.porcentaje && (
                          <span className="text-neutral-400">
                            · {fila.porcentaje}%
                            {meta &&
                              ` · S/ ${((Number(fila.porcentaje) / 100) * meta.monto_objetivo).toLocaleString()}`}
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-2">
                        {cumplida && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                            Cumplida
                          </span>
                        )}
                        {!cumplida && (
                          <span
                            role="button"
                            aria-label="Eliminar minimeta"
                            onClick={(e) => {
                              e.stopPropagation();
                              quitarFila(index);
                            }}
                            className="text-neutral-400"
                          >
                            🗑
                          </span>
                        )}
                      </span>
                    </button>

                    {fila.abierto && (
                      <div className="flex flex-col gap-3 border-t border-neutral-100 p-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-neutral-500">
                            Nombre
                          </label>
                          <input
                            value={fila.nombre}
                            disabled={cumplida}
                            onChange={(e) =>
                              actualizarFila(index, { nombre: e.target.value })
                            }
                            className="rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50"
                          />
                        </div>
                        <div className="flex gap-3">
                          <div className="flex flex-1 flex-col gap-1">
                            <label className="text-xs text-neutral-500">
                              Meta (%)
                            </label>
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
                              className="rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50"
                            />
                          </div>
                          <div className="flex flex-1 flex-col gap-1">
                            <label className="text-xs text-neutral-500">
                              Fecha límite
                            </label>
                            <input
                              type="date"
                              value={fila.fecha_limite}
                              disabled={cumplida}
                              onChange={(e) =>
                                actualizarFila(index, {
                                  fecha_limite: e.target.value,
                                })
                              }
                              className="rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-neutral-500">
                            Premio al cumplirla
                          </label>
                          <input
                            value={fila.premio}
                            disabled={cumplida}
                            onChange={(e) =>
                              actualizarFila(index, { premio: e.target.value })
                            }
                            className="rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-neutral-500">
                            Nota o motivación
                          </label>
                          <input
                            value={fila.nota}
                            disabled={cumplida}
                            onChange={(e) =>
                              actualizarFila(index, { nota: e.target.value })
                            }
                            className="rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-50"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={agregarFila}
              className="rounded-md border border-dashed border-neutral-300 py-2 text-sm text-neutral-500"
            >
              + Agregar nueva minimeta
            </button>
          </>
        )}

        {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={cerrar}
            className="flex-1 rounded-md border border-neutral-300 py-2.5 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando}
            className="flex-1 rounded-md bg-neutral-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>
      </div>
    </div>
  );
}
