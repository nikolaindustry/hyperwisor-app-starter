import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, User } from "lucide-react";

export function AppHeader({
  title,
  showBack,
  right,
}: {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
}) {
  const location = useLocation();
  return (
    <header className="h-14 border-b border-border bg-background flex items-center px-3 sticky top-0 z-10">
      {showBack ? (
        <Link
          to={".."}
          relative="path"
          className="w-10 h-10 flex items-center justify-center -ml-2"
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </Link>
      ) : null}
      <h1 className="text-base font-semibold flex-1 truncate">{title}</h1>
      {right ?? (
        <Link
          to="/account"
          state={{ from: location.pathname }}
          className="w-10 h-10 flex items-center justify-center"
          aria-label="Account"
        >
          <User size={20} />
        </Link>
      )}
    </header>
  );
}
