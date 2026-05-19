import { Link } from "react-router-dom";
import { appConfig } from "@config";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";

export function WelcomeScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <Logo size={88} />
        <div>
          <h1 className="text-3xl font-semibold">{appConfig.appName}</h1>
          <p className="text-muted mt-2 max-w-xs">
            Control your devices, anywhere. Sign in or create an account to get started.
          </p>
        </div>
      </div>
      <div className="w-full max-w-sm flex flex-col gap-3 pb-6">
        <Link to="/signin">
          <Button className="w-full" size="lg">Sign in</Button>
        </Link>
        <Link to="/signup">
          <Button className="w-full" size="lg" variant="secondary">Create account</Button>
        </Link>
      </div>
    </div>
  );
}
