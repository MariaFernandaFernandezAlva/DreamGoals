import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import type { Meta, Grupo, Minimeta } from "../../services/entities";
import { Celebracion } from "../../components/Celebracion";
import { useCelebrarMinimetas } from "../../hooks/useCelebrarMinimetas";

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

export function MetaDashboardPage() {
  const { metaId } = useParams<{ metaId: string }>();
  const location = useLocation();

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
    // Coincide: se marca como resuelta para que quede fija en verde,
    // sin importar los depósitos/retiros que vengan después.
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
    return <div>Cargando...</div>; // o el JSX que ya tengas ahí
  }

  // Arrancamos con todos los miembros en S/ 0, y encima sumamos lo
  // que cada uno realmente aportó — así el que aún no deposita nada
  // igual aparece en la lista, no solo quien ya tiene movimientos.
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

  // Próxima fecha límite de conciliación = la última que se hizo
  // (o la fecha de creación del grupo, si nunca se hizo ninguna)
  // más la frecuencia que definieron al crear el grupo.
  const fechaBase = ultimaConciliacion?.fecha ?? meta.created_at;
  const proximaFecha = new Date(fechaBase);
  proximaFecha.setDate(
    proximaFecha.getDate() + grupo.frecuencia_conciliacion_dias,
  );
  const conciliacionPendiente = new Date() > proximaFecha;
  const registroBloqueado =
    conciliacionPendiente || meta.estado === "completada";

  const porcentaje = Math.min(
    100,
    Math.round((acumulado / meta.monto_objetivo) * 100),
  );

  const diferencia =
    ultimaConciliacion && !ultimaConciliacion.resuelto
      ? ultimaConciliacion.saldo_declarado - acumulado
      : null;

  return (
    <div className="mx-auto max-w-4xl p-8">
      <Celebracion trigger={celebrarMinimeta} />
      <Celebracion trigger={celebrarMetaCompleta} intensidad="meta" />
      <Link to={`/grupo/${grupo.id}`} className="text-sm text-neutral-500">
        ← Volver a Metas
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{meta.nombre}</h1>
        {meta.estado === "completada" && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-sm font-semibold text-emerald-800">
              🎉 Meta completada
            </p>
            {meta.fecha_cierre && (
              <p className="text-xs text-emerald-600">
                {new Date(meta.fecha_cierre).toLocaleDateString()}
              </p>
            )}
            {imagenCierreUrl && (
              <a href={imagenCierreUrl} target="_blank" rel="noreferrer">
                <img
                  src={imagenCierreUrl}
                  alt="Evidencia del logro"
                  className="mt-3 h-56 w-full rounded-lg object-cover"
                />
              </a>
            )}
            {meta.comentario_cierre && (
              <p className="mt-3 text-sm text-emerald-800">
                {meta.comentario_cierre}
              </p>
            )}
          </div>
        )}
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs">
          {meta.estado === "activa" ? "Activa" : "Completada"}
        </span>
      </div>

      {meta.estado !== "completada" &&
        !registroBloqueado &&
        diferencia !== null &&
        diferencia !== 0 && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            ⚠ Hay S/ {Math.abs(diferencia).toLocaleString()} sin explicar desde
            la última conciliación (declaraste S/{" "}
            {ultimaConciliacion!.saldo_declarado.toLocaleString()}, el registro
            calcula S/ {acumulado.toLocaleString()}).
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
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            ✓ Todo correcto en la conciliación del{" "}
            {new Date(ultimaConciliacion.fecha).toLocaleDateString()}.
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
        <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
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
      <div className="mt-6 grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <p className="text-xs text-neutral-500">PROGRESO</p>
            <p className="text-3xl font-bold">
              S/ {acumulado.toLocaleString()}{" "}
              <span className="text-base font-normal text-neutral-400">
                / S/ {meta.monto_objetivo.toLocaleString()}
              </span>
            </p>
            <div className="mt-3 h-3 rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${porcentaje}%` }}
              />
            </div>

            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold">Minimetas</p>
              {minimetas.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {minimetas.map((m) => {
                    const montoCalculado =
                      (m.porcentaje / 100) * meta.monto_objetivo;
                    const cumplida = acumulado >= montoCalculado;
                    return (
                      <div
                        key={m.id}
                        className={`flex items-center justify-between rounded-md border p-3 text-sm ${
                          cumplida
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-neutral-200"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>
                            {m.nombre} · {m.porcentaje}% (S/{" "}
                            {montoCalculado.toLocaleString()})
                          </span>
                          {m.premio && (
                            <span className="text-xs text-neutral-500">
                              Premio: {m.premio}
                            </span>
                          )}
                        </div>
                        {cumplida && (
                          <span className="text-xs text-emerald-700">
                            Cumplida
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-neutral-400">
                  Todavía no configuraste minimetas para esta meta.
                </p>
              )}
              {meta.estado !== "completada" && (
                <Link
                  to={`/meta/${meta.id}/minimetas`}
                  state={{ backgroundLocation: location }}
                  className="mt-3 block w-full rounded-md border  border-neutral-200 py-2 text-center text-xs  text-neutral-700 hover:bg-neutral-50"
                >
                  Configurar minimetas
                </Link>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to={`/meta/${meta.id}/movimiento/deposito`}
              state={{ backgroundLocation: location }}
              onClick={(e) => registroBloqueado && e.preventDefault()}
              className={`flex-1 rounded-md py-3 text-center text-sm font-medium text-white ${
                registroBloqueado
                  ? "cursor-not-allowed bg-neutral-300"
                  : "bg-emerald-700"
              }`}
            >
              + Registrar depósito
            </Link>
            <Link
              to={`/meta/${meta.id}/movimiento/retiro`}
              state={{ backgroundLocation: location }}
              onClick={(e) => registroBloqueado && e.preventDefault()}
              className={`flex-1 rounded-md border py-3 text-center text-sm font-medium ${
                registroBloqueado
                  ? "cursor-not-allowed border-neutral-200 text-neutral-300"
                  : "border-neutral-900"
              }`}
            >
              − Registrar retiro
            </Link>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <p className="mb-3 text-sm font-semibold">
              Historial de movimientos
            </p>
            <table className="w-full text-left text-xs">
              <thead className="text-neutral-400">
                <tr>
                  <th className="pb-2">Fecha</th>
                  <th>Integrante</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Medio</th>
                  <th>Comentario</th>
                  <th>Foto</th>
                </tr>
              </thead>
              <tbody>
                {transacciones.map((t) => (
                  <tr key={t.id} className="border-t border-neutral-100">
                    <td className="py-2">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td>{t.perfiles?.nombre ?? "—"}</td>
                    <td>{t.tipo === "deposito" ? "Depósito" : "Retiro"}</td>
                    <td>S/ {t.monto.toLocaleString()}</td>
                    <td>{t.medio}</td>
                    <td className="text-neutral-500">{t.comentario ?? "—"}</td>
                    <td>
                      {t.evidencia_url && evidenciaUrls[t.evidencia_url] ? (
                        <a
                          href={evidenciaUrls[t.evidencia_url]}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={evidenciaUrls[t.evidencia_url]}
                            className="h-8 w-8 rounded object-cover"
                            alt=""
                          />
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transacciones.length === 0 && (
              <p className="text-xs text-neutral-400">
                Aún no hay movimientos.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {[...aportesPorUsuario.entries()].map(([usuarioId, m]) => (
            <div
              key={usuarioId}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold">
                {m.nombre[0]}
              </div>
              <div>
                <p className="text-sm font-semibold">{m.nombre}</p>
                <p className="text-xs text-neutral-500">
                  S/ {m.aportado.toLocaleString()} aportado
                </p>
              </div>
            </div>
          ))}

          {/* El formulario de configuración todavía no está construido
              — queda pendiente de tu diseño. */}
          <Link
            to={`/meta/${meta.id}/minimetas`}
            state={{ backgroundLocation: location }}
          >
            Minimetas
          </Link>
        </div>
      </div>
    </div>
  );
}
