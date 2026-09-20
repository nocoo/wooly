import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { BasaltProviders } from "@/components/BasaltProviders";
import { SessionProvider } from "@/components/SessionProvider";
import { AppShellRoute } from "@/AppShellRoute";
import { LoadingScreen } from "@/components/LoadingScreen";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const SourcesPage = lazy(() => import("@/pages/SourcesPage"));
const SourceDetailPage = lazy(() => import("@/pages/SourceDetailPage"));
const TrackerPage = lazy(() => import("@/pages/TrackerPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));

export function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <BasaltProviders>
          <Suspense fallback={<LoadingScreen label="页面加载中..." />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<AppShellRoute />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/sources" element={<SourcesPage />} />
                <Route path="/sources/:id" element={<SourceDetailPage />} />
                <Route path="/tracker" element={<TrackerPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BasaltProviders>
      </SessionProvider>
    </BrowserRouter>
  );
}
