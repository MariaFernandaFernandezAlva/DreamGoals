import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "./AuthProvider";
import { Spinner } from "../../components/Spinner";
import { LogOut, X, CalendarDays, UserGroup } from "lucide-react";

export function MiPerfilPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [nombre, setNombre] = useState("");
  const [miembroDesde, setMiembroDesde] = useState<string | null>(null);
  const [cantidadGrupos, setCantidadGrupos] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!user) return;

    supabase
      .from("perfiles")
      .select("nombre, created_at")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setNombre(data?.nombre ?? "");
        setMiembroDesde(data?.created_at ?? null);
        setCargando(false);
      });

    supabase
      .from("miembros_grupo")
      .select("grupo_id", { count: "exact", head: true })
      .eq("usuario_id", user.id)
      .then(({ count }) => setCantidadGrupos(count ?? 0));
  }, [user]);

  function cerrar() {
    navigate(-1);
  }

  async function handleGuardar() {
    if (!user || !nombre.trim()) return;
    setErrorMsg("");
    setGuardando(true);
    const { error } = await supabase
      .from("perfiles")
      .update({ nombre })
      .eq("id", user.id);
    setGuardando(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  }

  if (cargando) {
    return <Spinner variante="modal" />;
  }

  async function handleSalir() {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={cerrar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-sm flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-7"
      >
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute right-4 top-4 text-neutral-400"
        >
          <X className="w-5 h-5" />
        </button>
        {/*Encabezado */}
        <div className="flex flex-col items-center gap-1 mt-2">
          <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-[#E0F2F1] text-3xl font-medium text-[#006656] ring-[6px] ring-[#E0F2F1]/40">
            {nombre
              ? nombre.charAt(0).toUpperCase()
              : user?.email?.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-medium font-fraunces">Mi perfil</h1>
          <p className="text-sm text-neutral-500">
            Gestiona tu información personal y cuenta
          </p>
        </div>
        {/*Nombre*/}
        <div className="flex flex-col gap-1.5 mt-2">
          <label
            htmlFor="nombre"
            className="text-xs font-bold text-neutral-600"
          >
            Nombre Completo
          </label>
          <input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-xl bg-neutral border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
        </div>
        {/*Correo */}
        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-xs font-bold text-neutral-600">
            Correo electrónico
          </label>
          <div className="rounded-xl bg-neutral border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-neutral-400">
            {user?.email}
          </div>
        </div>
        {/*Fechas y grupos */}
        <div className="flex items-center justify-between text-sm text-neutral-500 mt-1">
          {miembroDesde && (
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-3 h-3"/>
              <span className="text-xs">
                Miembro desde {new Date(miembroDesde).toLocaleDateString()}
              </span>
            </div>
          )}
          {cantidadGrupos !== null && (
            <div className="flex items-center gap-1.5 rounded-xl border border-gray px-3 py-1 bg-gray-200 text-gray-700">
              <UserGroup className="w-3 h-3"/>
              <span className="text-xs">
                {cantidadGrupos}{" "}
                {cantidadGrupos === 1 ? "grupo activo" : "grupos activos"}
              </span>
            </div>
          )}
        </div>

        {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}
        {/*Botón de guardar */}
        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando || !nombre.trim()}
          className="mt-2 rounded-xl bg-azul py-3 text-sm font-semibold text-white disabled:opacity-50 hover:bg-azul/70"
        >
          {guardando
            ? "Guardando..."
            : guardado
              ? "✓ Guardado"
              : "Guardar cambios"}
        </button>
        {/*botón de Cerrar sesión */}
        <div className="mt-2 border-t border-neutral-100 pt-5 flex justify-center">
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-red-500"
            onClick={handleSalir}
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
