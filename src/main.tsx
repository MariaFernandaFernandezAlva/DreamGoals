import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AuthProvider, useAuth } from './features/auth/AuthProvider';
import { LoginPage } from './features/auth/LoginPage';

function Gate() {
  const { user, loading } = useAuth();

  if (loading) return null; // evita el parpadeo mientras se revisa la sesión

  if (!user) return <LoginPage />;

  return <div className="p-8">Sesión iniciada como {user.email} — aquí va el resto de la app.</div>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Gate />
    </AuthProvider>
  </StrictMode>
);