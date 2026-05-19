import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
    <div className="min-h-screen flex flex-col p-6">
      <h1 className="text-2xl font-semibold mt-8">Welcome back</h1>
      <p className="text-muted mt-1 mb-6">Sign in to manage your devices.</p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-medium">Email</label>
        <Input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className="text-sm font-medium mt-2">Password</label>
        <Input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Link to="/forgot-password" className="text-sm text-primary self-end mt-1">
          Forgot password?
        </Link>
        <Button type="submit" size="lg" loading={loading} className="mt-4">
          Sign in
        </Button>
      </form>
      <p className="text-sm text-muted text-center mt-auto pb-4">
        Don't have an account?{" "}
        <Link to="/signup" className="text-primary font-medium">Create one</Link>
      </p>
    </div>
  );
}
