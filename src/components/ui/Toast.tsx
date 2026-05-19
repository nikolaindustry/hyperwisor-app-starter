import * as React from "react";
import { cn } from "@/lib/utils";

type ToastItem = { id: number; message: string; tone: "info" | "success" | "danger" };
type Ctx = { push: (msg: string, tone?: ToastItem["tone"]) => void };

const ToastCtx = React.createContext<Ctx>({ push: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const push = React.useCallback((message: string, tone: ToastItem["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded px-4 py-2 text-sm shadow-md max-w-xs",
              t.tone === "success" && "bg-success text-white",
              t.tone === "danger" && "bg-danger text-white",
              t.tone === "info" && "bg-foreground text-background",
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => React.useContext(ToastCtx);
