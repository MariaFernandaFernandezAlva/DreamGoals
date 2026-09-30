import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import type { Meta, Grupo, Minimeta } from "../../services/entities";
import { Celebracion } from "../../components/Celebracion";
import { useCelebrarMinimetas } from "../../hooks/useCelebrarMinimetas";
import { useAuth } from "../auth/AuthProvider";
import { Spinner } from "../../components/Spinner";
import { Header } from "../../features/layout/Header";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  Minus,
  Plus,
  Settings,
  Sparkles,
  Target,
  Trash2,
  PartyPopper,
} from "lucide-react";

interface TransaccionFila {
  id: string;
  created_at: string;
  tipo: "deposito" | "retiro";
  monto: number;
  medio: string;
  comentario: string | null;
  evidencia_url: string | null;
  usuario_id: string;
  perfiles: { nombre: string } | null;
}

const LIMITE_MIEMBROS = 3;

function formatearSoles(valor: number) {
  return `S/ ${valor.toLocaleString("es-PE")}`;
}

function formatearFecha(valor: string, conAnio = false) {
  const fecha = new Date(valor.length === 10 ? `${valor}T00:00:00` : valor);
  return fecha.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    ...(conAnio ? { year: "numeric" } : {}),
  });
}

function EtiquetaTipo({ tipo }: { tipo: "deposito" | "retiro" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        tipo === "deposito"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-600"
      }`}
    >
      {tipo === "deposito" ? "Depósito" : "Retiro"}
    </span>
  );
}

export function MetaDashboardPage() {
  const { metaId } = useParams<{ metaId: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const [transaccionAEliminar, setTransaccionAEliminar] =
    useState<TransaccionFila | null>(null);

  const [meta, setMeta] = useState<Meta | null>(null);
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [transacciones, setTransacciones] = useState<TransaccionFila[]>([]);
  const [minimetas, setMinimetas] = useState<Minimeta[]>([]);
  const [miembros, setMiembros] = useState<
    { usuario_id: string; nombre: string }[]
  >([]);
  const [ultimaConciliacion, setUltimaConciliacion] = useState<{
    fecha: string;
    saldo_declarado: number;
    captura_url: string;
    resuelto: boolean;
  } | null>(null);
  const [evidenciaUrls, setEvidenciaUrls] = useState<Record<string, string>>(
    {},
  );
  const [capturaConciliacionUrl, setCapturaConciliacionUrl] = useState<
    string | null
  >(null);
  const [imagenCierreUrl, setImagenCierreUrl] = useState<string | null>(null);

  const [imagenMetaUrl, setImagenMetaUrl] = useState<string | null>(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [verTodos, setVerTodos] = useState(false);

  useEffect(() => {
    if (!meta?.imagen_cierre_url) {
      setImagenCierreUrl(null);
      return;
    }
    supabase.storage
      .from("evidencias")
      .createSignedUrl(meta.imagen_cierre_url, 3600)
      .then(({ data }) => setImagenCierreUrl(data?.signedUrl ?? null));
  }, [meta]);

  useEffect(() => {
    supabase
      .from("metas")
      .select("*")
      .eq("id", metaId!)
      .single()
      .then(({ data }) => setMeta(data));
  }, [metaId]);

  // Depende de "meta" porque necesitamos su grupo_id primero.
  useEffect(() => {
    if (!meta) return;
    supabase
      .from("grupos")
      .select("*")
      .eq("id", meta.grupo_id)
      .single()
      .then(({ data }) => setGrupo(data));
    supabase
      .from("miembros_grupo")
      .select("usuario_id, perfiles(nombre)")
      .eq("grupo_id", meta.grupo_id)
      .then(({ data }) => {
        const lista = (data ?? []).map((m) => ({
          usuario_id: m.usuario_id,
          nombre:
            (m.perfiles as unknown as { nombre: string } | null)?.nombre ??
            "Sin nombre",
        }));
        setMiembros(lista);
      });
  }, [meta]);

  useEffect(() => {
    supabase
      .from("conciliaciones")
      .select("fecha, saldo_declarado, captura_url, resuelto")
      .eq("meta_id", metaId!)
      .order("fecha", { ascending: false })
      .limit(1)
      .then(({ data }) => setUltimaConciliacion(data?.[0] ?? null));
  }, [metaId, location.key]);

  useEffect(() => {
    supabase
      .from("transacciones")
      .select("*, perfiles(nombre)")
      .eq("meta_id", metaId!)
      .order("created_at", { ascending: false })
      .then(({ data }) =>
        setTransacciones((data as unknown as TransaccionFila[]) ?? []),
      );
  }, [metaId, location.key]);

  useEffect(() => {
    supabase
      .from("minimetas")
      .select("*")
      .eq("meta_id", metaId!)
      .order("porcentaje", { ascending: true })
      .then(({ data }) => setMinimetas(data ?? []));
  }, [metaId, location.key]);

  useEffect(() => {
    const paths = transacciones
      .map((t) => t.evidencia_url)
      .filter((p): p is string => !!p);
    if (paths.length === 0) return;
    supabase.storage
      .from("evidencias")
      .createSignedUrls(paths, 3600)
      .then(({ data }) => {
        if (!data) return;
        const mapa: Record<string, string> = {};
        data.forEach((item) => {
          if (item.signedUrl) mapa[item.path!] = item.signedUrl;
        });
        setEvidenciaUrls(mapa);
      });
  }, [transacciones]);

  useEffect(() => {
    if (!ultimaConciliacion?.captura_url) {
      setCapturaConciliacionUrl(null);
      return;
    }
    supabase.storage
      .from("evidencias")
      .createSignedUrl(ultimaConciliacion.captura_url, 3600)
      .then(({ data }) => setCapturaConciliacionUrl(data?.signedUrl ?? null));
  }, [ultimaConciliacion]);

  useEffect(() => {
    if (!ultimaConciliacion || ultimaConciliacion.resuelto) return;
    const acumuladoActual = transacciones.reduce(
      (total, t) => total + (t.tipo === "deposito" ? t.monto : -t.monto),
      0,
    );
    if (ultimaConciliacion.saldo_declarado !== acumuladoActual) return;
    supabase
      .from("conciliaciones")
      .update({ resuelto: true })
      .eq("meta_id", metaId!)
      .eq("fecha", ultimaConciliacion.fecha)
      .then(() =>
        setUltimaConciliacion((prev) =>
          prev ? { ...prev, resuelto: true } : prev,
        ),
      );
  }, [ultimaConciliacion, transacciones, metaId]);

  useEffect(() => {
    if (!meta?.imagen_url) {
      setImagenMetaUrl(null);
      return;
    }
    supabase.storage
      .from("evidencias")
      .createSignedUrl(meta.imagen_url, 3600)
      .then(({ data }) => setImagenMetaUrl(data?.signedUrl ?? null));
  }, [meta]);

  useEffect(() => {
    if (!meta || !user) return;
    supabase
      .from("miembros_grupo")
      .select("rol")
      .eq("grupo_id", meta.grupo_id)
      .eq("usuario_id", user.id)
      .single()
      .then(({ data }) => setEsAdmin(data?.rol === "admin"));
  }, [meta, user]);

  const acumulado = transacciones.reduce(
    (total, t) => total + (t.tipo === "deposito" ? t.monto : -t.monto),
    0,
  );
  const metaCompletada = meta ? acumulado >= meta.monto_objetivo : false;
  const idsMinimetasCumplidas =
    !meta || metaCompletada
      ? []
      : minimetas
          .filter(
            (m) => acumulado >= (m.porcentaje / 100) * meta.monto_objetivo,
          )
          .map((m) => m.id);
  const idsMetaCompletada = metaCompletada ? [`${meta!.id}-completada`] : [];

  const celebrarMinimeta = useCelebrarMinimetas(idsMinimetasCumplidas);
  const celebrarMetaCompleta = useCelebrarMinimetas(idsMetaCompletada);

  if (!meta || !grupo) {
    return <Spinner />;
  }

  const aportesPorUsuario = new Map<
    string,
    { nombre: string; aportado: number }
  >();
  miembros.forEach((m) =>
    aportesPorUsuario.set(m.usuario_id, { nombre: m.nombre, aportado: 0 }),
  );
  transacciones.forEach((t) => {
    const actual = aportesPorUsuario.get(t.usuario_id) ?? {
      nombre: t.perfiles?.nombre ?? "Sin nombre",
      aportado: 0,
    };
    actual.aportado += t.tipo === "deposito" ? t.monto : -t.monto;
    aportesPorUsuario.set(t.usuario_id, actual);
  });

  const fechaBase = ultimaConciliacion?.fecha ?? meta.created_at;
  const proximaFecha = new Date(fechaBase);
  proximaFecha.setDate(
    proximaFecha.getDate() + grupo.frecuencia_conciliacion_dias,
  );
  const conciliacionPendiente = new Date() > proximaFecha;
  const registroBloqueado =
    conciliacionPendiente || meta.estado === "completada";

  const porcentaje = Math.max(
    0,
    Math.min(100, Math.round((acumulado / meta.monto_objetivo) * 100)),
  );

  const minimetasConEstado = minimetas.map((m) => {
    const monto = (m.porcentaje / 100) * meta.monto_objetivo;
    return { ...m, monto, cumplida: acumulado >= monto };
  });
  const totalCumplidas = minimetasConEstado.filter((m) => m.cumplida).length;
  const porcentajeMinimetas =
    minimetasConEstado.length > 0
      ? Math.round((totalCumplidas / minimetasConEstado.length) * 100)
      : 0;
  const premios = minimetasConEstado
    .map((m) => m.premio)
    .filter((p): p is string => !!p);

  const listaMiembros = [...aportesPorUsuario.entries()];
  const miembrosOrdenados =
    listaMiembros.length > LIMITE_MIEMBROS
      ? [...listaMiembros].sort((a, b) => b[1].aportado - a[1].aportado)
      : listaMiembros;
  const principales = miembrosOrdenados.slice(0, LIMITE_MIEMBROS);
  const restantes = miembrosOrdenados.slice(LIMITE_MIEMBROS);
  const puedeBorrar = (t: TransaccionFila) =>
    t.usuario_id === user?.id && meta.estado !== "completada";

  const diferencia =
    ultimaConciliacion && !ultimaConciliacion.resuelto
      ? ultimaConciliacion.saldo_declarado - acumulado
      : null;

  async function handleConfirmarEliminarTransaccion() {
    if (!transaccionAEliminar) return;
    const { error } = await supabase
      .from("transacciones")
      .delete()
      .eq("id", transaccionAEliminar.id);
    if (!error) {
      setTransacciones((prev) =>
        prev.filter((t) => t.id !== transaccionAEliminar.id),
      );
    }
    setTransaccionAEliminar(null);
  }

  return (
    <div className="min-h-screen bg-neutral text-negro">
      <Header grupoIdActual={grupo.id} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 md:px-8">
        <Celebracion trigger={celebrarMinimeta} />
        <Celebracion trigger={celebrarMetaCompleta} intensidad="meta" />

        {/* Foto principal de la meta */}
        {meta.imagen_url && (
          <div className="relative overflow-hidden rounded-3xl">
            {imagenMetaUrl ? (
              <img
                src={imagenMetaUrl}
                alt={meta.nombre}
                className="h-40 w-full object-cover sm:h-56 lg:h-64"
              />
            ) : (
              <div className="h-40 w-full animate-pulse bg-neutral-200 sm:h-56 lg:h-64" />
            )}
            {esAdmin && (
              <Link
                to={`/meta/${meta.id}/editar`}
                state={{ backgroundLocation: location }}
                className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-negro shadow-sm backdrop-blur hover:bg-white"
              >
                <Camera className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Editar foto de la meta</span>
                <span className="sm:hidden">Editar</span>
              </Link>
            )}
          </div>
        )}

        {/* Título + estado */}
        <div className="mt-5 flex items-center gap-3">
          <Link
            to={`/grupo/${grupo.id}`}
            aria-label="Volver a Metas"
            className="shrink-0 rounded-full p-1.5 text-negro hover:bg-neutral-200/60"
          >
            <ArrowLeft className="h-8 w-8" />
          </Link>
          <h1 className="min-w-0 truncate font-fraunces text-3xl font-extrabold sm:text-4xl">
            {meta.nombre}
          </h1>
          <span
            className={`ml-auto shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
              meta.estado === "activa"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-neutral-200 bg-neutral-100 text-neutral-600"
            }`}
          >
            {meta.estado === "activa" ? "Activa" : "Completada"}
          </span>
        </div>

        {/* Meta cerrada */}
        {meta.estado === "completada" && (
          <div className="flex flex-row items-center justify-start gap-5 mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
            {imagenCierreUrl && (
              <a href={imagenCierreUrl} target="_blank" rel="noreferrer">
                <img
                  src={imagenCierreUrl}
                  alt="Evidencia del logro"
                  className="h-20 w-full rounded-2xl object-cover"
                />
              </a>
            )}
            <div className="flex flex-col gap-1">
              <p className="flex items-center gap-3 text-sm font-semibold text-emerald-800">
                <PartyPopper className="w-3 h-3" />
                Meta completada
              </p>
              {meta.fecha_cierre && (
                <p className="text-xs text-gray-700">
                  {formatearFecha(meta.fecha_cierre, true)}
                </p>
              )}
              {meta.comentario_cierre && (
                <p className="mt-2 text-sm text-negro border-l-2 border-azul pl-3">
                  {meta.comentario_cierre}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Conciliación pendiente */}
        {meta.estado !== "completada" && conciliacionPendiente && (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="flex items-start justify-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Conciliación pendiente — no puedes registrar movimientos hasta
              resolverla
            </p>
            <Link
              to={`/meta/${meta.id}/conciliar`}
              state={{ backgroundLocation: location }}
              className="shrink-0 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-center text-sm font-medium text-negro shadow-sm hover:bg-neutral-50"
            >
              Subir conciliación
            </Link>
          </div>
        )}

        {meta.estado !== "completada" &&
          !registroBloqueado &&
          diferencia !== null &&
          diferencia !== 0 && (
            <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
              ⚠ Hay {formatearSoles(Math.abs(diferencia))} sin explicar desde la
              última conciliación (declaraste{" "}
              {formatearSoles(ultimaConciliacion!.saldo_declarado)}, el registro
              calcula {formatearSoles(acumulado)}).
              {capturaConciliacionUrl && (
                <a
                  href={capturaConciliacionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 font-medium underline"
                >
                  Ver captura
                </a>
              )}
            </div>
          )}

        {meta.estado !== "completada" &&
          !registroBloqueado &&
          ultimaConciliacion?.resuelto && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              ✓ Todo correcto en la conciliación del{" "}
              {formatearFecha(ultimaConciliacion.fecha, true)}.
              {capturaConciliacionUrl && (
                <a
                  href={capturaConciliacionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 font-medium underline"
                >
                  Ver captura
                </a>
              )}
            </div>
          )}

        {metaCompletada && meta.estado !== "completada" && (
          <div className="mt-5 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
            🎉 ¡Alcanzaste tu meta! Cierra la meta subiendo una foto y un
            comentario.
            <Link
              to={`/meta/${meta.id}/cerrar`}
              state={{ backgroundLocation: location }}
              className="ml-2 font-medium underline"
            >
              Cerrar meta
            </Link>
          </div>
        )}

        {/* Cuerpo */}
        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Progreso */}
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-8">
              <p className="text-xs tracking-wider text-neutral-500">
                PROGRESO
              </p>
              <p className="mt-1 font-fraunces text-4xl font-extrabold sm:text-5xl">
                {formatearSoles(acumulado)}{" "}
                <span className="text-lg font-normal text-neutral-400 sm:text-2xl">
                  / {formatearSoles(meta.monto_objetivo)}
                </span>
              </p>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-azul/15">
                <div
                  className="h-full rounded-full bg-azul transition-all"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <p className="font-semibold">Minimetas</p>
                  {minimetasConEstado.length > 0 && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                      Personalizadas activas
                    </span>
                  )}
                </div>
              </div>

              {minimetasConEstado.length > 0 ? (
                <div className="mt-4 flex flex-col gap-3">
                  {minimetasConEstado.map((m, i) => (
                    <div
                      key={m.id}
                      className={`flex items-center gap-3 rounded-2xl border p-4 ${
                        m.cumplida
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-neutral-200 bg-white"
                      }`}
                    >
                      {m.cumplida ? (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-azul text-white">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="h-6 w-6 shrink-0 rounded-full border-2 border-neutral-300" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          Minimeta {i + 1}: {m.nombre}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {m.porcentaje}% · {formatearSoles(m.monto)}
                          {m.premio && <> · Premio: {m.premio}</>}
                        </p>
                      </div>
                      {m.cumplida && (
                        <span className="shrink-0 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-700">
                          Cumplida
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-xs text-neutral-400">
                  Todavía no configuraste minimetas para esta meta.
                </p>
              )}
            </div>

            {/* Botones de registro */}
            <div>
              <div className="flex gap-3">
                <Link
                  to={`/meta/${meta.id}/movimiento/deposito`}
                  state={{ backgroundLocation: location }}
                  onClick={(e) => registroBloqueado && e.preventDefault()}
                  aria-disabled={registroBloqueado}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-2 py-4 text-sm font-semibold text-white transition-colors ${
                    registroBloqueado
                      ? "cursor-not-allowed bg-azul/40"
                      : "bg-azul shadow-sm hover:bg-[#007A7E]"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  Registrar depósito
                </Link>
                <Link
                  to={`/meta/${meta.id}/movimiento/retiro`}
                  state={{ backgroundLocation: location }}
                  onClick={(e) => registroBloqueado && e.preventDefault()}
                  aria-disabled={registroBloqueado}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-2 py-4 text-sm font-semibold transition-colors ${
                    registroBloqueado
                      ? "cursor-not-allowed bg-neutral-100 text-neutral-400"
                      : "border border-azul text-azul hover:bg-azul/5"
                  }`}
                >
                  <Minus className="h-4 w-4" />
                  Registrar retiro
                </Link>
              </div>
              {meta.estado !== "completada" && conciliacionPendiente && (
                <p className="mt-2 px-1 text-xs text-neutral-500">
                  Los botones se activan al subir la conciliación pendiente.
                </p>
              )}
            </div>
          </div>

          {/* Columna derecha */}
          <div className="flex flex-col gap-4">
            {principales.map(([usuarioId, m]) => (
              <div
                key={usuarioId}
                className="flex items-center gap-4 rounded-3xl border border-neutral-200/80 bg-white p-4 shadow-sm"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-naranja/25 text-lg font-semibold text-[#B5502A]">
                  {m.nombre[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.nombre}</p>
                  <p className="text-xs text-neutral-500">
                    {formatearSoles(m.aportado)} aportado
                  </p>
                </div>
              </div>
            ))}

            {restantes.length > 0 && (
              <div className="rounded-3xl border border-neutral-200/80 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setVerTodos((v) => !v)}
                  className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-neutral-700"
                >
                  <span>
                    {verTodos
                      ? "Ocultar integrantes"
                      : `Ver ${restantes.length} integrante${restantes.length > 1 ? "s" : ""} más`}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${verTodos ? "rotate-180" : ""}`}
                  />
                </button>
                {verTodos && (
                  <ul className="max-h-64 divide-y divide-neutral-100 overflow-y-auto border-t border-neutral-100">
                    {restantes.map(([usuarioId, m]) => (
                      <li
                        key={usuarioId}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-naranja/25 text-xs font-semibold text-[#B5502A]">
                          {m.nombre[0]?.toUpperCase()}
                        </div>
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {m.nombre}
                        </span>
                        <span className="shrink-0 text-xs text-neutral-500">
                          {formatearSoles(m.aportado)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Ritmo de ahorro */}
            <div className="rounded-3xl border border-neutral-200/80 bg-neutral-50/60 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Ritmo de Ahorro
              </p>
              <p className="mt-3 text-xs leading-relaxed text-neutral-600">
                Han alcanzado el <strong>{porcentaje}%</strong> de la meta
                establecida.
                {meta.estado !== "completada" &&
                  conciliacionPendiente &&
                  " Resolviendo la conciliación podrán continuar aportando de forma segura."}
              </p>
            </div>

            {/* Plan de minimetas */}
            {minimetasConEstado.length >= 0 && (
              <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="flex items-center gap-2 font-fraunces font-bold">
                    <Target className="h-4 w-4 text-red-500" />
                    Plan de Minimetas
                  </p>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                    {porcentajeMinimetas}% listo
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {minimetasConEstado.length} hito
                  {minimetasConEstado.length > 1 ? "s" : ""} configurado
                  {minimetasConEstado.length > 1 ? "s" : ""} · {totalCumplidas}{" "}
                  cumplido
                  {totalCumplidas !== 1 ? "s" : ""}
                </p>

                {premios.length > 0 && (
                  <>
                    <p className="mt-4 text-[11px] tracking-wider text-neutral-400">
                      RECOMPENSAS ACTIVAS
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {premios.map((premio, i) => (
                        <span
                          key={`${premio}-${i}`}
                          className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-700"
                        >
                          {premio}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {meta.estado !== "completada" && (
                  <Link
                    to={`/meta/${meta.id}/minimetas`}
                    state={{ backgroundLocation: location }}
                    className={`mt-5 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 py-3 text-sm font-medium text-azul transition-colors ${
                      registroBloqueado
                        ? "cursor-not-allowed bg-azul/40"
                        : "bg-emerald-50 hover:bg-emerald-100"
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    Configurar minimetas
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Historial de movimientos */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-sm">
          <h2 className="px-5 py-5 font-fraunces text-xl font-bold sm:px-8">
            Historial de movimientos
          </h2>

          {/* Móvil: tarjetas */}
          <ul className="divide-y divide-neutral-100 border-t border-neutral-100 md:hidden">
            {transacciones.map((t) => (
              <li
                key={t.id}
                className="flex items-start justify-center gap-3 px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-row gap-4 items-center">
                    {t.evidencia_url && evidenciaUrls[t.evidencia_url] && (
                      <a
                        href={evidenciaUrls[t.evidencia_url]}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={evidenciaUrls[t.evidencia_url]}
                          className="h-10 w-10 rounded-lg object-cover"
                          alt="Evidencia del movimiento"
                        />
                      </a>
                    )}
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex flex-row items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {t.perfiles?.nombre ?? "—"}
                        </p>
                        <span>:</span>
                        <p className="shrink-0 text-sm font-semibold">
                          {t.tipo === "retiro" && "− "}
                          {formatearSoles(t.monto)}
                        </p>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
                        <EtiquetaTipo tipo={t.tipo} />
                        <span>{formatearFecha(t.created_at)}</span>
                        <span>· {t.medio}</span>
                      </div>
                    </div>
                  </div>

                  {t.comentario && (
                    <p className="mt-3 line-clamp-2 text-xs text-neutral-500">
                      {t.comentario}
                    </p>
                  )}
                </div>

                {((t.evidencia_url && evidenciaUrls[t.evidencia_url]) ||
                  puedeBorrar(t)) && (
                  <div>
                    {puedeBorrar(t) && (
                      <button
                        type="button"
                        onClick={() => setTransaccionAEliminar(t)}
                        className="rounded-full p-2 text-red-500 hover:bg-red-50"
                        aria-label="Borrar movimiento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Escritorio: tabla */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50/70 text-xs text-neutral-500">
                <tr>
                  <th className="px-5 py-3 font-medium sm:px-8">Fecha</th>
                  <th className="px-3 py-3 font-medium">Integrante</th>
                  <th className="px-3 py-3 font-medium">Tipo</th>
                  <th className="px-3 py-3 font-medium">Monto</th>
                  <th className="px-3 py-3 font-medium">Medio</th>
                  <th className="px-3 py-3 font-medium">Comentario</th>
                  <th className="px-3 py-3 font-medium">Foto</th>
                  <th className="px-3 py-3 font-medium sm:pr-8">Acción</th>
                </tr>
              </thead>
              <tbody>
                {transacciones.map((t) => (
                  <tr key={t.id} className="border-t border-neutral-100">
                    <td className="px-5 py-4 sm:px-8">
                      {formatearFecha(t.created_at)}
                    </td>
                    <td className="px-3 py-4">{t.perfiles?.nombre ?? "—"}</td>
                    <td className="px-3 py-4">
                      <EtiquetaTipo tipo={t.tipo} />
                    </td>
                    <td className="px-3 py-4 font-semibold">
                      {t.tipo === "retiro" && "− "}
                      {formatearSoles(t.monto)}
                    </td>
                    <td className="px-3 py-4">{t.medio}</td>
                    <td className="px-3 py-4 text-neutral-500">
                      {t.comentario ?? "—"}
                    </td>
                    <td className="px-3 py-4">
                      {t.evidencia_url && evidenciaUrls[t.evidencia_url] ? (
                        <a
                          href={evidenciaUrls[t.evidencia_url]}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={evidenciaUrls[t.evidencia_url]}
                            className="h-8 w-8 rounded object-cover"
                            alt="Evidencia del movimiento"
                          />
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-4 sm:pr-8">
                      {puedeBorrar(t) && (
                        <button
                          type="button"
                          onClick={() => setTransaccionAEliminar(t)}
                          className="text-red-500 hover:text-red-600"
                          title="Borrar"
                          aria-label="Borrar movimiento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-neutral-100 px-5 py-3 text-xs text-neutral-400 sm:px-8">
            {transacciones.length === 0
              ? "Aún no hay movimientos."
              : `${transacciones.length} movimiento${transacciones.length > 1 ? "s" : ""}`}
          </div>
        </div>
      </main>

      {transaccionAEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setTransaccionAEliminar(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl bg-white p-6"
          >
            <h2 className="text-lg font-bold">
              ¿Borrar este{" "}
              {transaccionAEliminar.tipo === "deposito" ? "depósito" : "retiro"}
              ?
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              Se borrará {formatearSoles(transaccionAEliminar.monto)} del{" "}
              {formatearFecha(transaccionAEliminar.created_at, true)}. Esta
              acción no se puede deshacer.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setTransaccionAEliminar(null)}
                className="flex-1 rounded-md border border-neutral-300 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminarTransaccion}
                className="flex-1 rounded-md bg-red-600 py-2 text-sm font-medium text-white"
              >
                Borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
