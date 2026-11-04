import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryProvider } from "@/shared/context/QueryProvider";
import { AuthProvider } from "@/shared/context/AuthContext";
import { ColorModeProvider } from "@/shared/context/ColorModeContext";
import { Topbar } from "@/layouts/Topbar";
import { DevTasksFab } from "@/features/tasks/components/DevTasksFab/DevTasksFab";
import { UpdatePrompt } from "@/features/app-update/api";
import { QueryDevtoolsGate } from "@/components/common/QueryDevtoolsGate";
import { MainLayout } from "@/layouts/MainLayout/MainLayout";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { QueryErrorBoundary } from "@/components/common/QueryErrorBoundary";
import { reportError } from "@/features/error-reporting/services/errorReportService";

const HomePage = lazy(() => import("@/pages/HomePage").then((m) => ({ default: m.HomePage })));
const TasksPage = lazy(() =>
  import("@/pages/tasks/TasksPage").then((m) => ({ default: m.TasksPage }))
);
const LoginPage = lazy(() => import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const ResetPasswordPage = lazy(() =>
  import("@/pages/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage }))
);
const CreditsPage = lazy(() =>
  import("@/pages/CreditsPage").then((m) => ({ default: m.CreditsPage }))
);
const GamePage = lazy(() => import("@/pages/GamePage").then((m) => ({ default: m.GamePage })));
const AuthCallbackPage = lazy(() =>
  import("@/pages/AuthCallbackPage").then((m) => ({ default: m.AuthCallbackPage }))
);

/** Routes that fill the screen without the Topbar (the game has its own pause menu). */
const FULLSCREEN_ROUTES = new Set(["/tasks", "/spel"]);

const reportRenderError = (error: Error): void => reportError(error, "react");

function AppContent() {
  const location = useLocation();
  const isFullscreen = FULLSCREEN_ROUTES.has(location.pathname);

  return (
    <>
      {!isFullscreen && <Topbar />}
      <div className={isFullscreen ? undefined : "pt-toolbar"}>
        <QueryErrorBoundary onError={reportRenderError}>
          <Suspense fallback={<PageLoadingState />}>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/credits" element={<CreditsPage />} />
              </Route>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/spel" element={<GamePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </QueryErrorBoundary>
      </div>
      <UpdatePrompt />
      <DevTasksFab />
      <QueryDevtoolsGate />
    </>
  );
}

function App() {
  return (
    <ColorModeProvider>
      <QueryProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </QueryProvider>
    </ColorModeProvider>
  );
}

export default App;
