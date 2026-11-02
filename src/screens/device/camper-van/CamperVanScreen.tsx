/*
 * Camper Van HMI — product 1f577a41-080e-4f77-8162-30df2c5e82e9
 *
 * The panel's command vocabulary is documented in the firmware repo at
 * docs/CLOUD_COMMANDS.md. Three things in it shape this screen, and all
 * three are easy to get wrong:
 *
 * 1. hvac_control reads `power` and `auto` with cJSON_IsBool, so a STRING
 *    "true" is silently dropped -- no error, and `status` still comes back
 *    "ok". relay_control is relaxed about types and hvac_control is not, so
 *    the booleans below are real booleans, deliberately.
 *
 * 2. Coils 8-12 belong to the HVAC controller (fan low/med/high, clutch).
 *    relay_control refuses them on purpose, because two writers would fight.
 *    Only 0-7 are offered here.
 *
 * 3. rgb_control has no power parameter. A non-black colour means on and
 *    r=g=b=0 means off, so "turn the strip off" is sending black.
 *
 * State comes from get_status, asked for on mount. The panel answers with
 * everything at once, so there is no polling loop.
 */

import * as React from "react";
import { Lightbulb, Wind, Thermometer, Gauge, Power, Sparkles, Check } from "lucide-react";
import { Section, StatusHeader, MetricTile, MetricGrid, ToggleTile, Card, Button, Input } from "@/components/blocks";
import { StepperControl } from "@/components/blocks";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/auth/AuthProvider";
import { sdk } from "@/lib/sdk";
import type { DeviceScreenProps } from "../types";
import type { DeviceAction } from "@/lib/types";

/** Coils 0-7. Anything above 7 is HVAC-owned and refused by the firmware. */
const READING_LIGHTS = [0, 1, 2, 3, 4, 5, 6, 7];

const RGB_PRESETS = [
  { label: "Warm", hex: "#FF9A3C" },
  { label: "Cool", hex: "#6FB2F0" },
  { label: "Red", hex: "#E03131" },
  { label: "Green", hex: "#2F9E44" },
  { label: "Violet", hex: "#9775FA" },
];

type Hvac = {
  power: boolean;
  auto: boolean;
  fan_level: number;
  fan_step?: number;
  clutch?: boolean;
  cabin_valid?: boolean;
  cabin_c?: number;
  target_c: number;
  mode?: string;
};

export function CamperVanScreen({ device }: DeviceScreenProps) {
  const toast = useToast();
  const { user } = useAuth();

  const [relays, setRelays] = React.useState<Record<number, boolean>>({});
  const [hvac, setHvac] = React.useState<Hvac>({
    power: false,
    auto: false,
    fan_level: 1,
    target_c: 22,
  });
  const [cabin, setCabin] = React.useState<{ temp_c?: number; hpa?: number }>({});
  const [busy, setBusy] = React.useState<string | null>(null);
  const [heard, setHeard] = React.useState(false);

  /* The greeting shown on the panel's Overview tab. `welcome` is what the
   * panel reported; `draft` is what is in the box. Keeping them apart means
   * a status arriving mid-edit does not yank the text from under you. */
  const [welcome, setWelcome] = React.useState("");
  const [draft, setDraft] = React.useState("");
  const [editingName, setEditingName] = React.useState(false);
  /* The status subscription is created once, so reading `editingName` from
   * its closure would always see the value at mount. A ref gives the
   * callback the current one -- otherwise a status landing mid-edit would
   * overwrite what is being typed. */
  const editingRef = React.useRef(false);
  editingRef.current = editingName;

  /* Listen for the panel's replies, then ask for a full status. */
  React.useEffect(() => {
    if (!user?.id) return;

    const off = sdk.subscribeDeviceMessages(device.id, user.id, ({ command, params }) => {
      if (command !== "get_status") return;
      setHeard(true);

      const list = params.relays;
      if (Array.isArray(list)) {
        const next: Record<number, boolean> = {};
        for (const item of list as { relay?: number; state?: boolean }[]) {
          if (typeof item?.relay === "number") next[item.relay] = Boolean(item.state);
        }
        setRelays(next);
      }

      const bmp = params.bmp280 as { valid?: boolean; temp_c?: number; hpa?: number } | undefined;
      // `valid: false` means the sensor did not answer -- the fields are
      // absent rather than zero, so do not render a reading at all.
      if (bmp?.valid) setCabin({ temp_c: bmp.temp_c, hpa: bmp.hpa });

      const h = params.hvac as Partial<Hvac> | undefined;
      if (h) setHvac((prev) => ({ ...prev, ...h }));

      if (typeof params.welcome === "string") {
        setWelcome(params.welcome);
        // Only seed the box when it is not being edited.
        setDraft((d) => (editingRef.current ? d : (params.welcome as string)));
      }
    });

    void sdk.sendCommand(device.id, [{ command: "get_status", actions: [{ action: "read" }] }]);
    return off;
  }, [device.id, user?.id]);

  async function send(command: string, actions: DeviceAction[], key: string) {
    setBusy(key);
    try {
      await sdk.sendCommand(device.id, [{ command, actions }]);
    } catch (err) {
      toast.push((err as Error).message || "Command failed", "danger");
    } finally {
      setBusy(null);
    }
  }

  function toggleRelay(coil: number, next: boolean) {
    setRelays((prev) => ({ ...prev, [coil]: next })); // optimistic
    void send(
      "relay_control",
      [{ action: "update", params: { relay: coil, state: next } }],
      `relay-${coil}`,
    );
  }

  function allLights(next: boolean) {
    setRelays(Object.fromEntries(READING_LIGHTS.map((c) => [c, next])));
    void send(
      "relay_control",
      READING_LIGHTS.map((c) => ({ action: "update", params: { relay: c, state: next } })),
      "all-lights",
    );
  }

  /* Every hvac param below is a REAL boolean or number. See the note above. */
  function hvacPower(next: boolean) {
    setHvac((p) => ({ ...p, power: next }));
    void send("hvac_control", [{ action: "power", params: { on: next } }], "hvac-power");
  }

  function hvacAuto(next: boolean) {
    setHvac((p) => ({ ...p, auto: next }));
    void send("hvac_control", [{ action: "auto", params: { on: next } }], "hvac-auto");
  }

  function hvacFan(level: number) {
    const clamped = Math.min(5, Math.max(1, level)); // firmware drops anything outside 1-5
    setHvac((p) => ({ ...p, fan_level: clamped }));
    void send("hvac_control", [{ action: "fan_level", params: { level: clamped } }], "hvac-fan");
  }

  function hvacTemp(temp: number) {
    const clamped = Math.min(30, Math.max(16, Math.round(temp))); // 16-30 only
    setHvac((p) => ({ ...p, target_c: clamped }));
    void send("hvac_control", [{ action: "set_temp", params: { temp_c: clamped } }], "hvac-temp");
  }

  /* The panel caps the name at 32 characters (OWNER_NAME_MAX) and persists
   * it itself, re-fitting its cursive font to the new length. */
  function saveWelcome() {
    const name = draft.trim().slice(0, 32);
    if (!name || name === welcome) {
      setEditingName(false);
      return;
    }
    setWelcome(name);
    setEditingName(false);
    void send("config", [{ action: "set", params: { welcome: name } }], "welcome");
  }

  function setZone(zone: "roof" | "floor", hex: string) {
    void send("rgb_control", [{ action: zone, params: { hex } }], `rgb-${zone}`);
  }

  const lightsOn = READING_LIGHTS.filter((c) => relays[c]).length;

  return (
    <div className="flex flex-col gap-5 p-4 pb-10">
      <StatusHeader
        name={device.device_name}
        productName={device.iot_products?.product_name}
        online={device.is_online ?? false}
        lastSeen={device.last_seen}
      />

      <Section title="Panel greeting">
        <Card>
          <p className="text-[11.5px] text-muted leading-relaxed mb-3">
            Shown on the panel's home screen. Up to 32 characters.
          </p>
          <div className="flex gap-2">
            <Input
              value={draft}
              maxLength={32}
              placeholder="Owner"
              aria-label="Panel greeting name"
              onFocus={() => setEditingName(true)}
              onChange={(e) => {
                setEditingName(true);
                setDraft(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveWelcome();
              }}
            />
            <Button
              size="md"
              variant="secondary"
              loading={busy === "welcome"}
              disabled={!draft.trim() || draft.trim() === welcome}
              onClick={saveWelcome}
              aria-label="Save greeting"
            >
              <Check size={17} />
            </Button>
          </div>
        </Card>
      </Section>

      <MetricGrid>
        <MetricTile
          label="Cabin"
          value={cabin.temp_c !== undefined ? cabin.temp_c.toFixed(1) : "—"}
          unit={cabin.temp_c !== undefined ? "°C" : undefined}
          icon={<Thermometer size={13} />}
        />
        <MetricTile
          label="Pressure"
          value={cabin.hpa !== undefined ? Math.round(cabin.hpa).toString() : "—"}
          unit={cabin.hpa !== undefined ? "hPa" : undefined}
          icon={<Gauge size={13} />}
        />
      </MetricGrid>

      <Section
        title="Climate"
        action={
          hvac.mode ? (
            <span className="text-[11.5px] text-muted">
              {hvac.mode}
              {hvac.clutch ? " · compressor on" : ""}
            </span>
          ) : undefined
        }
      >
        <div className="flex flex-col gap-3">
          <ToggleTile
            label="Air conditioning"
            description={hvac.power ? "On" : "Off"}
            icon={<Power size={18} />}
            value={hvac.power}
            loading={busy === "hvac-power"}
            onChange={hvacPower}
          />
          <ToggleTile
            label="Auto"
            description={hvac.auto ? "Holding the target" : "Manual fan"}
            icon={<Wind size={18} />}
            value={hvac.auto}
            loading={busy === "hvac-auto"}
            onChange={hvacAuto}
          />

          <Card>
            <StepperControl
              label="Target temperature"
              value={hvac.target_c}
              unit="°C"
              min={16}
              max={30}
              loading={busy === "hvac-temp"}
              onChange={hvacTemp}
            />
          </Card>

          <Card>
            <div className="flex flex-col gap-3">
              <div className="min-w-0">
                <div className="font-medium text-sm">Fan</div>
                <div className="text-xs text-muted mt-0.5">
                  {hvac.auto
                    ? "Set by auto"
                    : hvac.fan_step !== undefined && hvac.fan_step !== hvac.fan_level
                      ? `Level ${hvac.fan_level} · ramping through ${hvac.fan_step}`
                      : `Level ${hvac.fan_level}`}
                </div>
              </div>
              {/* Own row: on a phone the status line wraps, and sharing the
                  row squeezed these into unusable slivers. */}
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    aria-label={`Fan level ${lvl}`}
                    aria-pressed={hvac.fan_level === lvl}
                    disabled={hvac.auto}
                    onClick={() => hvacFan(lvl)}
                    className={`flex-1 h-11 rounded-md text-[13px] font-medium transition-shadow
                      disabled:opacity-40 disabled:pointer-events-none
                      ${hvac.fan_level === lvl ? "shadow-press text-primary" : "shadow-lift-sm"}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </Section>

      <Section
        title="Reading lights"
        action={
          <span className="text-[11.5px] text-muted">
            {lightsOn} of {READING_LIGHTS.length} on
          </span>
        }
      >
        <div className="flex gap-2 mb-3">
          <Button
            size="sm"
            variant="secondary"
            loading={busy === "all-lights"}
            onClick={() => allLights(true)}
          >
            All on
          </Button>
          <Button size="sm" variant="secondary" onClick={() => allLights(false)}>
            All off
          </Button>
        </div>
        <div className="flex flex-col gap-2.5">
          {READING_LIGHTS.map((coil) => (
            <ToggleTile
              key={coil}
              label={`Reading Light ${coil + 1}`}
              icon={<Lightbulb size={18} />}
              value={Boolean(relays[coil])}
              loading={busy === `relay-${coil}`}
              onChange={(next) => toggleRelay(coil, next)}
            />
          ))}
        </div>
      </Section>

      <Section title="LED strips">
        <p className="text-[11.5px] text-muted -mt-0.5 mb-1 px-0.5">
          Picking a colour switches the zone on; Off sends black.
        </p>
        <div className="flex flex-col gap-3">
          {(["roof", "floor"] as const).map((zone) => (
            <Card key={zone}>
              <div className="flex items-center gap-2.5 mb-3">
                <Sparkles size={15} className="text-muted" />
                <span className="font-medium text-sm capitalize">{zone}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {RGB_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    aria-label={`${zone} ${p.label}`}
                    onClick={() => setZone(zone, p.hex)}
                    className="w-10 h-10 rounded-md shadow-lift-sm active:shadow-press-sm transition-shadow"
                    style={{ background: p.hex }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setZone(zone, "#000000")}
                  className="h-10 px-4 rounded-md text-[13px] font-medium shadow-lift-sm
                             active:shadow-press-sm transition-shadow"
                >
                  Off
                </button>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {!heard ? (
        <p className="text-xs text-muted text-center px-6 leading-relaxed">
          Waiting for the panel to report its state. Controls still work — they are
          sent straight to the vehicle.
        </p>
      ) : null}
    </div>
  );
}
