import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";

export function WelcomeScreen() {
  return (
    <div className="min-h-screen flex flex-col bg-background px-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        {/* The mark alone. It is moulded out of the ground, so framing it in
            a card puts a raised panel inside a raised panel and the relief
            stops reading. The wordmark already says the name, so a heading
            repeating it was saying the same thing twice. */}
        <Logo height={52} />
        <p className="text-muted text-[15px] leading-relaxed max-w-[17rem]">
          Your vehicle, in your pocket — wherever you park it.
        </p>
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
