import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

export function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      toast.push("Reset email sent. Check your inbox.", "success");
      navigate("/signin");
    } catch (err) {
      toast.push((err as Error).message || "Could not send reset email", "danger");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="We'll email you a link to set a new password."
      footer={
        <Link to="/signin" className="text-primary font-medium">
          Back to sign in
        </Link>
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
        <Button type="submit" size="lg" loading={loading} className="mt-2">
          Send reset link
        </Button>
      </form>
    </AuthShell>
  );
}
