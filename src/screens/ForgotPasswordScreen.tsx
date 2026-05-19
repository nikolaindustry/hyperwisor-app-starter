import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
    <div className="min-h-screen flex flex-col p-6">
      <h1 className="text-2xl font-semibold mt-8">Reset password</h1>
      <p className="text-muted mt-1 mb-6">
        Enter your email and we'll send you a reset link.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-medium">Email</label>
        <Input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" size="lg" loading={loading} className="mt-4">
          Send reset email
        </Button>
      </form>
      <Link to="/signin" className="text-sm text-primary text-center mt-auto pb-4">
        Back to sign in
      </Link>
    </div>
  );
}
