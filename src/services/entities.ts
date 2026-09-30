import type { Database } from './types';

// Cada alias toma la forma exacta de la tabla real en Supabase —
// si algún día cambias una columna y regeneras types.ts, estos
// alias se actualizan solos, sin tocar nada aquí.
export type Perfil = Database['public']['Tables']['perfiles']['Row'];
export type Grupo = Database['public']['Tables']['grupos']['Row'];
export type MiembroGrupo = Database['public']['Tables']['miembros_grupo']['Row'];
export type Meta = Database['public']['Tables']['metas']['Row'];
export type Minimeta = Database['public']['Tables']['minimetas']['Row'];
export type Transaccion = Database['public']['Tables']['transacciones']['Row'];
export type Conciliacion = Database['public']['Tables']['conciliaciones']['Row'];