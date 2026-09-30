import { createClient } from '@supabase/supabase-js';
import type { Database } from './types.ts';

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