import { useNavigate } from "react-router-dom";
import { LogOut, Mail, Info } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/auth/AuthProvider";
import { appConfig } from "@config";

export function AccountScreen() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function onSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader title="Account" showBack />
      <main className="flex-1 p-4 flex flex-col gap-3">
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted mb-1">Signed in as</div>
          <div className="font-semibold">{user?.name ?? "—"}</div>
          <div className="text-sm text-muted">{user?.email}</div>
        </Card>

        {appConfig.features.showSupportLink ? (
          <a
            href={`mailto:${appConfig.supportEmail}`}
            className="rounded border border-border bg-surface p-4 flex items-center gap-3"
          >
            <Mail size={18} className="text-muted" />
            <div className="flex-1">
              <div className="text-sm font-medium">Contact support</div>
              <div className="text-xs text-muted">{appConfig.supportEmail}</div>
            </div>
          </a>
        ) : null}

        <Card>
          <div className="flex items-center gap-3">
            <Info size={18} className="text-muted" />
            <div className="flex-1">
              <div className="text-sm font-medium">{appConfig.appName}</div>
              <div className="text-xs text-muted">Version {appConfig.version}</div>
            </div>
          </div>
        </Card>

        <Button variant="secondary" onClick={onSignOut} className="mt-2">
          <LogOut size={16} />
          Sign out
        </Button>
      </main>
    </div>
  );
}
