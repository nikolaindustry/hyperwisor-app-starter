import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
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
    <AuthShell
      title="Create account"
      subtitle="It only takes a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/signin" className="text-primary font-medium">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Name">
          <Input
            autoComplete="name"
            placeholder="Jordan Lee"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
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
        <Field label="Password" hint="Use at least 8 characters.">
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" size="lg" loading={loading} className="mt-2">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
