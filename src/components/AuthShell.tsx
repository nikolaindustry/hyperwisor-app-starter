import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

/**
 * Shared layout for the auth screens — back button, logo, title block,
 * and a form area. Keeps Sign in / Sign up / Reset visually consistent.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div
        className="flex items-center h-14 px-3"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="w-9 h-9 -ml-1 flex items-center justify-center rounded-md hover:bg-surface transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-4">
        <Logo size={44} />
        <h1 className="text-[26px] font-semibold tracking-tight mt-5">
          {title}
        </h1>
        <p className="text-muted text-[15px] mt-1.5">{subtitle}</p>

        <div className="mt-7">{children}</div>

        {footer ? (
          <div
            className="mt-auto py-6 text-center text-sm text-muted"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
