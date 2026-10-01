import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../../services/Supabaseclient";
import { GroupSwitcher } from "../grupos/GroupSwitcher";
import { useAuth } from "../auth/AuthProvider";
import { NotificacionesBell } from "../../components/NotificacionesBell";
import { Settings, Sparkles } from "lucide-react"; 

interface HeaderProps {
  grupoIdActual: string;
}

export function Header({ grupoIdActual }: HeaderProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    if (!user) return;

    supabase
      .from("perfiles")
      .select("nombre")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setNombre(data?.nombre ?? "");
      });
  }, [user]);

  const userInitial = nombre
    ? nombre.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-200/60 bg-bagde backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 sm:px-4 sm:py-4 md:px-8">
        {/* 1. Logo con estilo tipográfico */}
        <Link
          to="/mis-grupos"
          className="flex shrink-0 items-center gap-2 text-xl text-negro"
        >
          <Sparkles className="text-azul w-5 h-5"/>
          <h2 className="tracking-tight font-fraunces text-base md:text-xl ">DreamGoals</h2>
        </Link>

        {/* 2. Zona central / derecha: GroupSwitcher, Configuración y Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 ml-auto">
          <GroupSwitcher grupoIdActual={grupoIdActual} />
          <NotificacionesBell />
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-azulclaro text-sm font-bold text-azul shadow-sm hover:opacity-80 sm:h-10 sm:w-10"
          >
            {userInitial}
          </Link>
        </div>
      </div>
    </header>
  );
}
