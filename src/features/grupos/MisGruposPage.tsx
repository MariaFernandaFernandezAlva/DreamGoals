import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../auth/AuthProvider';
import type { Grupo, Perfil } from '../../services/entities';
import { Header } from '../layout/Header'; // <-- Importamos tu Header unificado

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

  if (!grupos) return <div className="p-8 text-center text-gray-500">Cargando grupos...</div>;

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
    <div className="min-h-screen bg-[#FAF8F5] text-[#1B1B1B]">
      
      {/* 1. Header unificado arriba (pasamos un id ficticio o vacío si no estamos dentro de un grupo específico) */}
      <Header grupoIdActual="" />

      {/* 2. Contenedor principal con ancho expandido (max-w-7xl) */}
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-12">
        
        {/* Cabecera de bienvenida personalizada */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200/60 pb-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Hola de nuevo,</p>
            <h1 className="text-3xl font-heading font-extrabold text-[#1B1B1B]">
              {perfil?.nombre ?? user?.email ?? 'Usuario'}
            </h1>
          </div>

          {/* Botón superior de crear grupo */}
          <Link
            to="/crear-grupo"
            className="inline-flex items-center gap-2 rounded-full bg-[#007A7E] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#006656] transition-colors self-start md:self-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Crear grupo
          </Link>
        </div>

        {/* Subtítulo de sección */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold text-[#1B1B1B]">Mis grupos</h2>
          <span className="text-sm text-gray-500 font-medium">{grupos.length} {grupos.length === 1 ? 'grupo' : 'grupos'} en total</span>
        </div>

        {/* Listado de Grupos */}
        {grupos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center shadow-inner">
            <svg className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-lg font-medium text-gray-600">Aún no perteneces a ningún grupo.</p>
            <p className="text-sm text-gray-400 mt-1 max-w-sm">Crea uno nuevo o pídele a alguien que te comparta un link de invitación.</p>
            <Link
              to="/crear-grupo"
              className="mt-6 rounded-full bg-[#007A7E] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#006656] transition-colors"
            >
              + Crear mi primer grupo
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
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF9E6C] text-sm font-bold text-white ring-2 ring-white shadow-sm">
                            {in2}
                          </div>
                        )}
                      </div>

                      {/* Etiqueta de Activo */}
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F2EF] px-3 py-1 text-xs font-bold text-[#007A7E]">
                        <span className="h-2 w-2 rounded-full bg-[#2EB872]"></span>
                        Activo
                      </span>
                    </div>

                    {/* Nombre del Grupo y Descripción opcional */}
                    <h3 className="text-xl font-heading font-bold text-[#1B1B1B] group-hover:text-[#007A7E] transition-colors">
                      {grupo.nombre}
                    </h3>
                    {/*}
                    <p className="text-sm text-gray-500 mt-1">
                      {meta.comentario_cierre ?? 'Metas y ahorro en equipo'}
                    </p>*/}
                  </div>

                  {/* Línea divisoria y pie de tarjeta */}
                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      {/* Icono de personas */}
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                      <span>{grupo.cantidad_integrantes ?? 2} integrantes máx.</span>
                    </div>

                    {/* Flecha indicadora */}
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 group-hover:bg-[#007A7E] group-hover:text-white transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Tarjeta inferior tipo "Consejo de enfoque" (como en tu diseño de referencia) */}
        <div className="mt-12 flex items-center gap-4 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#FF9E6C]/20 text-[#D96B33]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.475a12.06 12.06 0 01-4.5 0m7.5-11.25a9.002 9.002 0 00-11.25 0m11.25 0a9.003 9.003 0 01-11.25 0" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold tracking-wider text-[#D96B33] uppercase">Consejo de enfoque</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">
              Compartir metas con una sola persona aumenta la consistencia hasta un 76%.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}