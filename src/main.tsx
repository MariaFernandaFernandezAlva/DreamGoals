import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import type { Location } from "react-router-dom";
import "./index.css";
import { AuthProvider, useAuth } from "./features/auth/AuthProvider";
import { LoginPage } from "./features/auth/LoginPage";
import { CrearGrupoPage } from "./features/grupos/CrearGrupoPage";
import { InvitacionPage } from "./features/grupos/InvitacionPage";
import { MisGruposPage } from "./features/grupos/MisGruposPage";
import { UnirseGrupoPage } from "./features/auth/UnirseGrupoPage";
import { PanelGrupoPage } from "./features/metas/PanelGrupoPage";
import { CrearMetaPage } from "./features/metas/CrearMetaPage";
import { MetaDashboardPage } from "./features/metas/MetaDashboardPage";
import { MovimientoPage } from "./features/metas/MovimientoPage";
import { ConciliarPage } from "./features/grupos/ConciliarPage";
import { MinimetasPage } from "./features/metas/MinimetasPage";
import { CerrarMetaPage } from "./features/metas/CerrarMetaPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/mis-grupos" replace />;
  return <LoginPage />;
}

function AppRoutes() {
  const location = useLocation();
  // Cuando un Link/navigate() incluye state.backgroundLocation, quiere
  // decir "esto es un modal — sigue mostrando esa otra pantalla detrás".
  const state = location.state as { backgroundLocation?: Location } | null;
  const background = state?.backgroundLocation;

  return (
    <>
      {/* Si hay "fondo" guardado, las rutas normales se resuelven con
          ESA ubicación, no con la actual — por eso el panel del grupo
          o el dashboard de la meta se siguen viendo aunque la URL ya
          diga /nueva-meta, /movimiento o /conciliar. */}
      <Routes location={background ?? location}>
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
          path="/meta/:metaId"
          element={
            <RequireAuth>
              <MetaDashboardPage />
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
        <Route
          path="/meta/:metaId/movimiento/:tipo"
          element={
            <RequireAuth>
              <MovimientoPage />
            </RequireAuth>
          }
        />
        <Route
          path="/meta/:metaId/conciliar"
          element={
            <RequireAuth>
              <ConciliarPage />
            </RequireAuth>
          }
        />
        <Route
          path="/meta/:metaId/minimetas"
          element={
            <RequireAuth>
              <MinimetasPage />
            </RequireAuth>
          }
        />
        <Route
          path="/meta/:metaId/cerrar"
          element={
            <RequireAuth>
              <CerrarMetaPage />
            </RequireAuth>
          }
        />
      </Routes>

      {/* Segundo <Routes>: SOLO se monta cuando venimos navegando
          desde dentro de la app con state.backgroundLocation — ahí
          es cuando dibujamos el modal ENCIMA de lo de arriba. */}
      {background && (
        <Routes>
          <Route
            path="/grupo/:grupoId/nueva-meta"
            element={
              <RequireAuth>
                <CrearMetaPage />
              </RequireAuth>
            }
          />
          <Route
            path="/meta/:metaId/movimiento/:tipo"
            element={
              <RequireAuth>
                <MovimientoPage />
              </RequireAuth>
            }
          />
          <Route
            path="/meta/:metaId/conciliar"
            element={
              <RequireAuth>
                <ConciliarPage />
              </RequireAuth>
            }
          />
          <Route
            path="/meta/:metaId/minimetas"
            element={
              <RequireAuth>
                <MinimetasPage />
              </RequireAuth>
            }
          />
          <Route
            path="/meta/:metaId/cerrar"
            element={
              <RequireAuth>
                <CerrarMetaPage />
              </RequireAuth>
            }
          />
        </Routes>
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
