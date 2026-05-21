import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { WelcomeScreen } from "@/screens/WelcomeScreen";
import { SignInScreen } from "@/screens/SignInScreen";
import { SignUpScreen } from "@/screens/SignUpScreen";
import { ForgotPasswordScreen } from "@/screens/ForgotPasswordScreen";
import { DeviceListScreen } from "@/screens/DeviceListScreen";
import { ActivityScreen } from "@/screens/ActivityScreen";
import { AddDeviceScreen } from "@/screens/AddDeviceScreen";
import { NameDeviceScreen } from "@/screens/NameDeviceScreen";
import { DeviceDetailScreen } from "@/screens/DeviceDetailScreen";
import { DeviceSettingsScreen } from "@/screens/DeviceSettingsScreen";
import { AccountScreen } from "@/screens/AccountScreen";
import { TabLayout } from "@/components/TabLayout";
import { MockBanner } from "@/components/MockBanner";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent" />
      </div>
    );
  }
  return user ? children : <Navigate to="/" replace />;
}

export function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MockBanner />
      <div className="flex-1 flex flex-col">
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/devices" replace /> : <WelcomeScreen />}
          />
          <Route path="/signin" element={<SignInScreen />} />
          <Route path="/signup" element={<SignUpScreen />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />

          {/* Top-level tabs — share the bottom navigation */}
          <Route
            element={
              <RequireAuth>
                <TabLayout />
              </RequireAuth>
            }
          >
            <Route path="/devices" element={<DeviceListScreen />} />
            <Route path="/activity" element={<ActivityScreen />} />
            <Route path="/account" element={<AccountScreen />} />
          </Route>

          {/* Pushed screens — no tab bar */}
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
