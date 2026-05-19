import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export function SignUpScreen() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.push("Password must be at least 8 characters", "danger");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, name);
      navigate("/devices", { replace: true });
    } catch (err) {
      toast.push((err as Error).message || "Sign up failed", "danger");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col p-6">
      <h1 className="text-2xl font-semibold mt-8">Create your account</h1>
      <p className="text-muted mt-1 mb-6">Takes about a minute.</p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-medium">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
        <label className="text-sm font-medium mt-2">Email</label>
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <p className="text-xs text-muted">Use at least 8 characters.</p>
        <Button type="submit" size="lg" loading={loading} className="mt-4">
          Create account
        </Button>
      </form>
      <p className="text-sm text-muted text-center mt-auto pb-4">
        Already have an account?{" "}
        <Link to="/signin" className="text-primary font-medium">Sign in</Link>
      </p>
    </div>
  );
}
