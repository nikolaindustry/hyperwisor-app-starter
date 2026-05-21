import { useNavigate } from "react-router-dom";
import { ChevronRight, LogOut, Mail, Monitor, Moon, Sun } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/blocks/Section";
import { useAuth } from "@/auth/AuthProvider";
import { useTheme } from "@/theme/ThemeProvider";
import { cn } from "@/lib/utils";
import { appConfig } from "@config";
import type { ThemeMode } from "@/lib/theme";

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: "light", label: "Light", icon: Sun },
  { mode: "dark", label: "Dark", icon: Moon },
  { mode: "system", label: "Auto", icon: Monitor },
];

export function AccountScreen() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();

  const initials = (user?.name || user?.email || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  async function onSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  return (
    <div className="flex flex-col">
      <AppHeader title="Account" />
      <div className="flex-1 p-4 flex flex-col gap-6">
        {/* Profile */}
        <Card className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[15px] truncate">
              {user?.name ?? "Account"}
            </div>
            <div className="text-sm text-muted truncate">{user?.email}</div>
          </div>
        </Card>

        {/* Appearance */}
        <Section title="Appearance">
          <Card>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-surface">
              {THEME_OPTIONS.map(({ mode: m, label, icon: Icon }) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-2.5 rounded-md text-xs font-medium transition-colors",
                    mode === m
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </Card>
        </Section>

        {/* Support + about */}
        <Section title="About">
          <div className="flex flex-col gap-2.5">
            {appConfig.features.showSupportLink ? (
              <a
                href={`mailto:${appConfig.supportEmail}`}
                className="rounded-lg border border-border bg-card shadow-sm p-3.5 flex items-center gap-3 hover:bg-surface transition-colors"
              >
                <div className="w-9 h-9 rounded-md bg-surface flex items-center justify-center text-muted">
                  <Mail size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">Contact support</div>
                  <div className="text-xs text-muted truncate">
                    {appConfig.supportEmail}
                  </div>
                </div>
                <ChevronRight size={18} className="text-muted/60" />
              </a>
            ) : null}

            <Card className="flex items-center justify-between">
              <span className="text-sm text-muted">Version</span>
              <span className="text-sm font-medium">{appConfig.version}</span>
            </Card>
          </div>
        </Section>

        <Button variant="secondary" onClick={onSignOut} className="text-danger">
          <LogOut size={16} />
          Sign out
        </Button>
      </div>
    </div>
  );
}
