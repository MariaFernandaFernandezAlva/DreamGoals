import { Link, useLocation, useNavigate } from "react-router-dom";
import { GroupSwitcher } from "../grupos/GroupSwitcher";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../../services/supabaseClient";
import { NotificacionesBell } from "../../components/NotificacionesBell";

interface HeaderProps {
  grupoIdActual: string;
}

export function Header({ grupoIdActual }: HeaderProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  async function handleSalir() {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  // Obtener la inicial del usuario para el avatar (ej: "P" de Paolo)
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-200/60 bg-[#FAF8F5]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        {/* 1. Logo con estilo tipográfico */}
        <Link
          to="/mis-grupos"
          className="flex items-center gap-2 text-xl font-extrabold text-[#1B1B1B]"
        >
          <span className="text-azul">✦</span>
          <span className="font-heading tracking-tight">DreamGoals</span>
        </Link>

        {/* 2. Zona central / derecha: GroupSwitcher, Configuración y Avatar */}
        <div className="flex items-center gap-4">
          {/* Selector de Grupo */}
          <GroupSwitcher grupoIdActual={grupoIdActual} />
          <NotificacionesBell />
          {/* Botón de configuración (Opcional / Estético) */}
          {grupoIdActual && (
            <Link
              to={`/grupo/${grupoIdActual}/configuracion`}
              state={{ backgroundLocation: location }}
              className="rounded-full p-2 text-gray-600 hover:bg-gray-200/50 transition-colors"
              title="Configuración"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.932 6.932 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.332.183-.582.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </Link>
          )}
          {/* Avatar de Usuario */}
          <Link
            to="/mi-perfil"
            state={{ backgroundLocation: location }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C8E6DF] text-sm font-bold text-[#006656] shadow-sm hover:opacity-80"
          >
            {userInitial}
          </Link>
          {/*Boton de salir */}
          <button
            type="button"
            onClick={handleSalir}
            className="rounded-full p-2 text-gray-600 hover:bg-gray-200/50 transition-colors"
            title="Cerrar sesión"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
