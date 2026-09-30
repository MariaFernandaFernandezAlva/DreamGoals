import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../services/supabaseClient';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

// Contexto vacío por defecto — nadie debería leerlo directo,
// siempre a través del hook useAuth() de abajo.
const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // "loading" evita el parpadeo de "no hay sesión" mientras
  // Supabase todavía está revisando si existe una sesión guardada.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Al montar, revisa si ya hay una sesión activa (por ejemplo,
    //    si recargaste la página estando logueado).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // 2. A partir de ahora, cualquier cambio de sesión (login, logout,
    //    o el link mágico procesándose solo) actualiza el estado aquí.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    // 3. Cuando el componente se desmonta, dejamos de escuchar —
    //    si no haces esto, cada recarga en caliente en desarrollo
    //    va acumulando listeners duplicados.
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook que vas a usar en cualquier componente: const { user } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}