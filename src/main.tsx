import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { AuthProvider, useAuth } from './features/auth/AuthProvider';
import { LoginPage } from './features/auth/LoginPage';
import { CrearGrupoPage } from './features/grupos/CrearGrupoPage';
import { InvitacionPage } from './features/grupos/InvitacionPage';
import { MisGruposPage } from './features/grupos/MisGruposPage';
import { UnirseGrupoPage } from './features/auth/UnirseGrupoPage';
import { PanelGrupoPage } from './features/metas/PanelGrupoPage';
import { CrearMetaPage } from './features/metas/CrearMetaPage';

// Envuelve cualquier ruta que exija sesión iniciada. Si no hay
// usuario, manda de vuelta al login en vez de mostrar la pantalla.
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// La ruta raíz decide: si hay sesión, va directo a crear grupo
// (por ahora no hay pantalla de "Mis grupos" todavía); si no, login.
function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/mis-grupos" replace />;
  return <LoginPage />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/unirse/:codigo" element={<UnirseGrupoPage />} />
          <Route
            path="/mis-grupos"
            element={
              <RequireAuth>
                <MisGruposPage />
              </RequireAuth>
            }
          />
          <Route
            path="/crear-grupo"
            element={
              <RequireAuth>
                <CrearGrupoPage />
              </RequireAuth>
            }
          />
          <Route
            path="/invitacion/:grupoId"
            element={
              <RequireAuth>
                <InvitacionPage />
              </RequireAuth>
            }
          />
          <Route
            path="/grupo/:grupoId"
            element={
              <RequireAuth>
                <PanelGrupoPage />
              </RequireAuth>
            }
          />
          <Route
            path="/grupo/:grupoId/nueva-meta"
            element={
              <RequireAuth>
                <CrearMetaPage />
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);