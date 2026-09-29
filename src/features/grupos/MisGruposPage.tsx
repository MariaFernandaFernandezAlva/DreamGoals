import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../auth/AuthProvider';
import type { Grupo, Perfil } from '../../services/entities';
import { Header } from '../layout/Header';
import { Spinner } from '../../components/Spinner';
import { UserGroup, ArrowRight, Lightbulb, Plus } from "lucide-react";

export function MisGruposPage() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [grupos, setGrupos] = useState<Grupo[] | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setPerfil(data));

    supabase
      .from('grupos')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setGrupos(data ?? []));
  }, [user]);

  if (!grupos){
    return <Spinner />;
  }

  // Función auxiliar para extraer iniciales (Ej: "Paolo & María" -> "P", "M")
  const obtenerIniciales = (nombre: string) => {
    const partes = nombre.split(/[\s&]+/);
    if (partes.length >= 2) {
      return [partes[0][0]?.toUpperCase() || 'G', partes[1][0]?.toUpperCase() || ''];
    }
    return [nombre[0]?.toUpperCase() || 'G', ''];
  };

  const bgColores = ['bg-[#007A7E]', 'bg-[#FF9E6C]', 'bg-[#2EB872]', 'bg-[#E056fd]'];

  return (
    <div className="min-h-screen bg-neutral text-[#1B1B1B]">
      
      {/* 1. Header unificado arriba (pasamos un id ficticio o vacío si no estamos dentro de un grupo específico) */}
      <Header grupoIdActual="" />

      {/* 2. Contenedor principal con ancho expandido (max-w-7xl) */}
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-12">
        
        {/* Cabecera de bienvenida personalizada */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200/60 pb-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Hola de nuevo,</p>
            <h1 className="text-3xl font-heading font-fraunces font-extrabold text-negro">
              {perfil?.nombre ?? user?.email ?? 'Usuario'}
            </h1>
          </div>

          {/* Botón superior de crear grupo */}
          <Link
            to="/crear-grupo"
            className="inline-flex items-center gap-2 rounded-full bg-[#007A7E] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#006656] transition-colors self-start md:self-auto"
          >
            <Plus className="h-4 w-4" strokeWidth={3}/>
            Crear grupo
          </Link>
        </div>

        {/* Subtítulo de sección */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold font-fraunces text-negro">Mis grupos</h2>
          <span className="text-sm text-gray-500 font-medium">{grupos.length} {grupos.length === 1 ? 'grupo' : 'grupos'} en total</span>
        </div>

        {/* Listado de Grupos */}
        {grupos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center shadow-inner">
            <UserGroup className="h-16 w-16 text-gray-600"/> 
            <p className="text-xl font-medium font-fraunces text-gray-600">Aún no perteneces a ningún grupo.</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">Crea uno nuevo o pídele a alguien que te comparta un link de invitación.</p>
            <Link
              to="/crear-grupo"
              className="inline-flex items-center gap-2 mt-6 rounded-full bg-[#007A7E] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#006656] transition-colors"
            >
              <Plus className="w-3 h-3" strokeWidth={4}/>
              Crear mi primer grupo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {grupos.map((grupo, index) => {
              const [in1, in2] = obtenerIniciales(grupo.nombre);

              return (
                <Link
                  key={grupo.id}
                  to={`/grupo/${grupo.id}`}
                  className="group relative flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-white p-6 shadow-md transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Parte Superior: Avatares y Estado Activo */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      {/* Avatares combinados */}
                      <div className="flex -space-x-2.5 overflow-hidden">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ${bgColores[index % bgColores.length]}`}>
                          {in1}
                        </div>
                        {in2 && (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-naranja text-sm font-bold text-white ring-2 ring-white shadow-sm">
                            {in2}
                          </div>
                        )}
                      </div>

                      {/* Etiqueta de Activo */}
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F2EF] px-3 py-1 text-xs font-bold text-[#007A7E]">
                        <span className="h-2 w-2 rounded-full bg-verde"></span>
                        Activo
                      </span>
                    </div>

                    {/* Nombre del Grupo y Descripción opcional */}
                    <h3 className="text-xl font-fraunces font-bold text-negro group-hover:text-[#007A7E] transition-colors">
                      {grupo.nombre}
                    </h3>
                  </div>

                  {/* Línea divisoria y pie de tarjeta */}
                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      {/* Icono de personas */}
                      <UserGroup className="w-4 h-4"/>
                      <span>{grupo.cantidad_integrantes ?? 2} integrantes máx.</span>
                    </div>

                    {/* Flecha indicadora */}
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 group-hover:bg-[#007A7E] group-hover:text-white transition-all">
                      <ArrowRight className="w-4 h-4"/>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Tarjeta inferior tipo "Consejo de enfoque" (como en tu diseño de referencia) */}
        <div className="mt-12 flex items-center gap-4 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-naranja/40 text-njoscuro">
            <Lightbulb className="w-6 h-6" strokeWidth={2}/>
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider text-njoscuro uppercase">Consejo de enfoque</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">
              Compartir metas con una sola persona aumenta la consistencia hasta un 76%.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}