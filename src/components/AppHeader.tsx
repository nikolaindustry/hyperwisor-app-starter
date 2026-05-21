import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

/**
 * Screen header.
 * - Pushed screens: pass `showBack` for a back button.
 * - Top-level (tab) screens: omit `showBack`; optionally pass `subtitle`
 *   and a `right` action.
 */
export function AppHeader({
  title,
  subtitle,
  showBack,
  right,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <header
      className="sticky top-0 z-20 bg-background/85 backdrop-blur-md border-b border-border"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="h-14 flex items-center gap-1.5 px-3">
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 -ml-1 flex items-center justify-center rounded-md text-foreground hover:bg-surface transition-colors"
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </button>
        ) : null}
        <div className="flex-1 min-w-0">
          <h1 className="text-[17px] font-semibold leading-tight truncate">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-xs text-muted truncate">{subtitle}</p>
          ) : null}
        </div>
        {right ? <div className="flex items-center gap-1">{right}</div> : null}
      </div>
    </header>
  );
}

/** A circular icon button for header actions. */
export function HeaderAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-9 h-9 flex items-center justify-center rounded-md text-foreground hover:bg-surface transition-colors"
    >
      {icon}
    </button>
  );
}
