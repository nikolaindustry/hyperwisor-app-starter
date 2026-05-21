import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { isMockMode } from "@config";

export function SignInScreen() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = React.useState(isMockMode() ? "demo@hyperwisor.com" : "");
  const [password, setPassword] = React.useState(isMockMode() ? "demo1234" : "");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/devices", { replace: true });
    } catch (err) {
      toast.push((err as Error).message || "Sign in failed", "danger");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your devices."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-medium">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Email">
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Link
          to="/forgot-password"
          className="text-[13px] text-primary font-medium self-end -mt-1"
        >
          Forgot password?
        </Link>
        <Button type="submit" size="lg" loading={loading} className="mt-2">
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
