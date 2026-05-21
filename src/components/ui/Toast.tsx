import * as React from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "info" | "success" | "danger";
type ToastItem = { id: number; message: string; tone: ToastTone };
type Ctx = { push: (msg: string, tone?: ToastTone) => void };

const ToastCtx = React.createContext<Ctx>({ push: () => {} });

const toneIcon: Record<ToastTone, React.ReactNode> = {
  info: <Info size={16} className="text-primary" />,
  success: <CheckCircle2 size={16} className="text-success" />,
  danger: <AlertTriangle size={16} className="text-danger" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const push = React.useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3600);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed left-1/2 -translate-x-1/2 top-3 z-[100] flex flex-col items-center gap-2 px-4 w-full max-w-sm pointer-events-none">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-lg border border-border bg-card",
              "px-3.5 py-3 shadow-lg text-sm text-foreground animate-fade-in",
            )}
          >
            <span className="shrink-0">{toneIcon[t.tone]}</span>
            <span className="flex-1 leading-snug">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => React.useContext(ToastCtx);
