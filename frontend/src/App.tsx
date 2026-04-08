import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "#src/context/AuthContext";
import { LanguageProvider } from "#src/context/LanguageContext";
import { PageLoader } from "#src/components/ui/PageLoader";
import { LoginPage } from "#src/pages/LoginPage";
import { TicketsPage } from "#src/pages/TicketsPage";
import { NewTicketPage } from "#src/pages/NewTicketPage";
import { SettingsPage } from "#src/pages/SettingsPage";
import { ProfilePage } from "#src/pages/ProfilePage";
import type { UserRole } from "#src/types";
import { ReactNode } from "react";

interface ProtectedProps {
  children: ReactNode;
  roles?: UserRole[];
}

function Protected({ children, roles }: ProtectedProps) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/tickets/waiting" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/tickets/waiting" replace />;
  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />
      <Route path="/tickets/new" element={<Protected roles={["user"]}><NewTicketPage /></Protected>} />
      <Route path="/tickets/:tab" element={<Protected><TicketsPage /></Protected>} />
      <Route path="/settings" element={<Protected roles={["admin"]}><SettingsPage /></Protected>} />
      <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  );
}