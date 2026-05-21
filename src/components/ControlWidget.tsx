import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { sdk } from "@/lib/sdk";
import { useToast } from "@/components/ui/Toast";
import type { ProductCommand } from "@/lib/types";

/**
 * Renders one product_command as an interactive widget driven by its
 * action_parameters. Supports boolean (toggle), number (slider), enum
 * (segmented control), and string (input).
 */
export function ControlWidget({
  deviceId,
  command,
}: {
  deviceId: string;
  command: ProductCommand;
}) {
  const toast = useToast();
  const action = command.command_actions?.[0];
  const param = action?.action_parameters?.[0];
  const [value, setValue] = React.useState<string | number | boolean>(
    param?.default_value ?? "",
  );
  const [busy, setBusy] = React.useState(false);

  async function send(next: typeof value) {
    if (!action || !param) return;
    setBusy(true);
    try {
      await sdk.sendCommand(deviceId, [
        {
          command: command.command_name,
          actions: [{ action: action.action_name, params: { [param.name]: next } }],
        },
      ]);
      setValue(next);
    } catch (err) {
      toast.push((err as Error).message || "Command failed", "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-medium text-sm">{command.command_name}</div>
          {command.command_description ? (
            <div className="text-xs text-muted">{command.command_description}</div>
          ) : null}
        </div>
      </div>

      {param?.type === "boolean" ? (
        <Button
          variant={value ? "primary" : "secondary"}
          loading={busy}
          onClick={() => send(!value)}
          className="w-full"
        >
          {value ? "On" : "Off"}
        </Button>
      ) : param?.type === "number" ? (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={param.min ?? 0}
            max={param.max ?? 100}
            value={Number(value)}
            disabled={busy}
            onChange={(e) => setValue(Number(e.target.value))}
            onMouseUp={(e) => send(Number((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) => send(Number((e.target as HTMLInputElement).value))}
            className="flex-1 accent-[var(--color-primary)]"
          />
          <span className="text-sm font-medium w-12 text-right">{Number(value)}</span>
        </div>
      ) : param?.type === "enum" && param.options ? (
        <div className="flex flex-wrap gap-2">
          {param.options.map((opt) => (
            <Button
              key={opt}
              size="sm"
              variant={value === opt ? "primary" : "secondary"}
              loading={busy && value === opt}
              onClick={() => send(opt)}
            >
              {opt}
            </Button>
          ))}
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={String(value)}
            onChange={(e) => setValue(e.target.value)}
            placeholder={param?.name}
          />
          <Button loading={busy} onClick={() => send(value)}>
            Send
          </Button>
        </div>
      )}
    </Card>
  );
}
