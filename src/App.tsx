import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { WelcomeScreen } from "@/screens/WelcomeScreen";
import { SignInScreen } from "@/screens/SignInScreen";
import { SignUpScreen } from "@/screens/SignUpScreen";
import { ForgotPasswordScreen } from "@/screens/ForgotPasswordScreen";
import { DeviceListScreen } from "@/screens/DeviceListScreen";
import { AddDeviceScreen } from "@/screens/AddDeviceScreen";
import { NameDeviceScreen } from "@/screens/NameDeviceScreen";
import { DeviceDetailScreen } from "@/screens/DeviceDetailScreen";
import { DeviceSettingsScreen } from "@/screens/DeviceSettingsScreen";
import { AccountScreen } from "@/screens/AccountScreen";
import { MockBanner } from "@/components/MockBanner";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted text-sm">
        Loading…
      </div>
    );
  }
  return user ? children : <Navigate to="/" replace />;
}

export function App() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <MockBanner />
      <div className="flex-1">
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/devices" replace /> : <WelcomeScreen />}
          />
          <Route path="/signin" element={<SignInScreen />} />
          <Route path="/signup" element={<SignUpScreen />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />

          <Route
            path="/devices"
            element={
              <RequireAuth>
                <DeviceListScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/add"
            element={
              <RequireAuth>
                <AddDeviceScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/add/name"
            element={
              <RequireAuth>
                <NameDeviceScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/devices/:id"
            element={
              <RequireAuth>
                <DeviceDetailScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/devices/:id/settings"
            element={
              <RequireAuth>
                <DeviceSettingsScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/account"
            element={
              <RequireAuth>
                <AccountScreen />
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {loading ? null : null}
      </div>
    </div>
  );
}
