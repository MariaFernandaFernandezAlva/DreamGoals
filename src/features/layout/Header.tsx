import { Link, useLocation } from "react-router-dom";
import { GroupSwitcher } from "../grupos/GroupSwitcher";
import { useAuth } from "../auth/AuthProvider";
import { NotificacionesBell } from "../../components/NotificacionesBell";
import { Settings } from "lucide-react"; 

interface HeaderProps {
  grupoIdActual: string;
}

export function Header({ grupoIdActual }: HeaderProps) {
  const { user } = useAuth();
  const location = useLocation();

  // Obtener la inicial del usuario para el avatar (ej: "P" de Paolo)
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-200/60 bg-bagde backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        {/* 1. Logo con estilo tipográfico */}
        <Link
          to="/mis-grupos"
          className="flex items-center gap-2 text-xl text-[#1B1B1B]"
        >
          <span className="text-azul">✦</span>
          <h2 className="tracking-tight font-fraunces">DreamGoals</h2>
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
              <Settings className="w-5 h-5"/>
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
        </div>
      </div>
    </header>
  );
}
