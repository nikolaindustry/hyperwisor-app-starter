import { Link } from "react-router-dom";
import { appConfig } from "@config";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";

export function WelcomeScreen() {
  return (
    <div className="min-h-screen flex flex-col bg-background px-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-7">
        <div className="rounded-2xl p-px bg-gradient-to-b from-border to-transparent">
          <div className="rounded-2xl bg-card p-5 shadow-sm">
            <Logo size={64} />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-[26px] font-semibold tracking-tight">
            {appConfig.appName}
          </h1>
          <p className="text-muted text-[15px] leading-relaxed max-w-[17rem]">
            Monitor and control your devices — anywhere, anytime.
          </p>
        </div>
      </div>

      <div
        className="w-full max-w-sm mx-auto flex flex-col gap-2.5 pb-8"
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
      >
        <Link to="/signin">
          <Button className="w-full" size="lg">
            Sign in
          </Button>
        </Link>
        <Link to="/signup">
          <Button className="w-full" size="lg" variant="secondary">
            Create account
          </Button>
        </Link>
      </div>
    </div>
  );
}
