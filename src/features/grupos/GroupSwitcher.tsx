import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import type { Grupo } from "../../services/entities";

export function GroupSwitcher({ grupoIdActual }: { grupoIdActual: string }) {
  const [abierto, setAbierto] = useState(false);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    const cerrarSiEsFuera = (e: PointerEvent) => {
      if (!contenedorRef.current?.contains(e.target as Node)) {
        setAbierto(false);
      }
    };

    document.addEventListener("pointerdown", cerrarSiEsFuera);
    return () => document.removeEventListener("pointerdown", cerrarSiEsFuera);
  }, [abierto]);

  useEffect(() => {
    supabase
      .from("grupos")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setGrupos(data ?? []));
  }, []);

  const actual = grupos.find((g) => g.id === grupoIdActual);
  const recientes = grupos.slice(0, 3); // Mostramos hasta 3 recientes si deseas

  // Función auxiliar para extraer iniciales de un nombre de grupo (ej: "Paolo & María" -> "P" y "M")
  const obtenerIniciales = (nombre: string) => {
    const partes = nombre.split(/[\s&]+/);
    if (partes.length >= 2) {
      return [
        partes[0][0]?.toUpperCase() || "G",
        partes[1][0]?.toUpperCase() || "",
      ];
    }
    return [nombre[0]?.toUpperCase() || "G", ""];
  };

  // Colores bonitos para los avatares combinados
  const bgColores = ["bg-azul", "bg-naranja", "bg-[#006656]", "bg-njoscuro"];

  return (
    <div ref={contenedorRef} className="sm:relative">
      {/* Botón principal del selector */}
      <button
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-[#C8E6DF] bg-[#E8F2EF] px-3 py-2 text-sm font-semibold text-[#007A7E] shadow-sm transition-all hover:bg-[#d8ece7] sm:gap-2 sm:px-5"
      >
        <span className="hidden sm:inline">Grupo:</span>
        <span className="hidden max-w-27.5 truncate text-negro sm:max-w-50 md:block">
          {actual?.nombre ?? "Seleccionar..."}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className={`h-4 w-4 transition-transform ${abierto ? "rotate-180" : ""}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 15.75l7.5-7.5 7.5 7.5"
          />
        </svg>
      </button>

      {/* Menú desplegable */}
      {abierto && (
        <>
          {/* Fondo invisible para cerrar al hacer clic afuera */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAbierto(false)}
          />

          <div className="absolute right-0 z-50 mt-3 w-80 rounded-2xl border border-gray-100 bg-white p-3 shadow-2xl">
            <p className="px-3 py-2 text-[11px] font-bold tracking-wider text-gray-400">
              CAMBIAR DE GRUPO
            </p>

            <div className="space-y-1">
              {recientes.map((g, index) => {
                const esActual = g.id === grupoIdActual;
                const [in1, in2] = obtenerIniciales(g.nombre);

                return (
                  <Link
                    key={g.id}
                    to={`/grupo/${g.id}`}
                    onClick={() => setAbierto(false)}
                    className={`flex items-center justify-between rounded-xl p-3 transition-all ${
                      esActual
                        ? "border border-[#C8E6DF] bg-[#F5FAF9]"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatares superpuestos con iniciales */}
                      <div className="flex -space-x-2 overflow-hidden">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${bgColores[index % bgColores.length]}`}
                        >
                          {in1}
                        </div>
                        {in2 && (
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-white shadow-sm ${bgColores[(index + 1) % bgColores.length]}`}
                          >
                            {in2}
                          </div>
                        )}
                      </div>

                      {/* Textos del grupo */}
                      <div>
                        <p className="text-sm font-bold text-negro">
                          {g.nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          {g.cantidad_integrantes ?? 2} integrantes
                        </p>
                      </div>
                    </div>

                    {/* Check de selección */}
                    {esActual && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="h-5 w-5 text-[#007A7E]"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    )}
                  </Link>
                );
              })}
            </div>

            <hr className="my-2 border-gray-100" />

            {/* Opciones inferiores */}
            <div className="space-y-1">
              <Link
                to="/mis-grupos"
                onClick={() => setAbierto(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {/* Icono de cuadrícula */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="h-5 w-5 text-gray-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                  />
                </svg>
                Ver todos mis grupos
              </Link>

              <Link
                to="/crear-grupo"
                onClick={() => setAbierto(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#007A7E] hover:bg-[#F5FAF9] transition-colors"
              >
                {/* Icono de más */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="h-5 w-5 text-[#007A7E]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Crear nuevo grupo
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
