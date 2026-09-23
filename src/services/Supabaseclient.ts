import { createClient } from '@supabase/supabase-js';
import type { Database } from './Types.ts';

// Estas dos variables vienen de .env.local — Vite las inyecta en build time.
// Si alguna falta, mejor fallar temprano con un mensaje claro que dejar que
// el error aparezca después, confuso, en cualquier llamada a la base de datos.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_KEY en tu archivo .env.local'
  );
}

// El genérico <Database> le da a cada .from('tabla') y .rpc('funcion')
// el tipo correcto automáticamente, usando lo que definimos en types.ts.
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);