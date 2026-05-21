# CLAUDE.md — AI Agent Playbook

You are the AI agent that turns this starter kit into a finished, branded IoT
app. A manufacturer cloned this repo, set their API keys, and will ask you to
**build the UI for one of their products**. This file tells you exactly how.

Read it fully before generating anything.

---

## 1. What this project is

A white-label user-facing IoT app for **Hyperwisor manufacturers** (web +
Capacitor native). The foundation is already built: auth, device onboarding,
device list, realtime, theming, navigation.

Your job is the part that can't be pre-built: the **bespoke device screen** for
each product. A camper van, a hydroponics system, and a medical sensor must
each feel like a purpose-built product — not the same generic widget grid.

> This is deliberately **not** the Hyperwisor canvas dashboard builder. Do not
> render `dashboard_config` JSON. Generate real, clean, hand-written React
> screens. That bespoke quality is the entire point of this project.

---

## 2. The manufacturer's workflow

1. Clone repo, `npm install --legacy-peer-deps`, set keys in `.env.local`
2. `npm run inspect` → lists their products
3. `npm run inspect <productId>` → writes `.hyperwisor/product-<id>.json`
4. They ask you: *"build the UI for product &lt;id&gt;"* (+ optional style/feature notes)
5. You generate the screen, register it, verify it builds
6. `npm run dev` → finished app

---

## 3. Your job, step by step

When asked to build a product's UI:

### Step 1 — Get the spec
Run the inspector if the spec file is missing:
```bash
npm run inspect <productId>
```
Read `.hyperwisor/product-<id>.json`. It contains:
- `product` — name, category, model, description
- `commandsApi` — raw command/action list from the API
- `capabilities.controls` — **the most important field.** The manufacturer's
  own dashboard controls: each has a `title` (their real label), a
  `widgetType` (their intended affordance), and an `events` map of UI
  event → command payload. Use these titles and types verbatim — they are
  the manufacturer's intent. Do NOT invent your own labels.
- `capabilities.displays` — telemetry the manufacturer surfaces, with their
  chosen `title` and `unit`.
- `capabilities.commands` — raw deduped command vocabulary (low-level reference).
- `capabilities.theme` — the manufacturer's dashboard colors.
- `sensorSample` — real telemetry readings (shape + units)
- `notes` — gaps to ask the manufacturer about

**`controls` vs `commandsApi`:** the API lists every command the firmware
*can* accept; `controls` lists what the manufacturer actually *put in their
UI*. Follow `controls` — if the API has Relay 3 & 4 but the dashboard only
uses 1 & 2, build 1 & 2. Mention the rest to the manufacturer rather than
guessing.

**widgetType → affordance** (build the matching control):
- `switch` → latching on/off (`ToggleTile`)
- `button` → momentary press (`HoldButton`) — fires on press, reverts on release
- `slider` → numeric range; `gauge`/`label`/`status` → read-only display
- `joystick`, `color-picker`, etc. → match the obvious control
- `payment-action` → a paid unlock; the starter has no payment layer —
  note it to the manufacturer, don't implement it

### Step 2 — Ask, don't guess
If the spec is thin (no capabilities, empty notes flagged), **ask the
manufacturer** before generating. You need to know:
- What can the device *do*? (commands, actions, parameters)
- What does it *report*? (sensors, units, ranges)
- What *events* should the UI react to?
- Any priority feature or screen they want

A wrong guess produces a screen that doesn't control the real device.

### Step 3 — Generate the screen
Create `src/screens/device/<product-slug>/<ProductName>Screen.tsx`.
It must `export` a component matching `DeviceScreenProps` (`{ device }`).
Compose it from the design-system blocks (Section 5). Imitate the example
(Section 6).

### Step 4 — Register it
Add one line to `src/screens/device/productScreenRegistry.ts`:
```ts
import { CamperVanScreen } from "./camper-van/CamperVanScreen";
// ...
export const productScreens = {
  "1f577a41-080e-4f77-8162-30df2c5e82e9": CamperVanScreen,
};
```

### Step 5 — Verify
Run `npm run build` (or `npx tsc --noEmit`). Fix every type error. The screen
must compile cleanly before you report done.

---

## 4. The command protocol (critical)

Commands reach a device over the realtime WebSocket. **Always send through
`sdk.sendCommand`** — never invent another path.

```ts
import { sdk } from "@/lib/sdk";

await sdk.sendCommand(device.id, [
  {
    command: "setPower",                       // from capabilities.commands
    actions: [
      { action: "turnOn", params: { outletId: "0" } },
    ],
  },
]);
```

- `command`, `action`, and `params` keys come **verbatim** from
  `capabilities.commands` in the spec file. Do not rename them.
- The device id is bound at runtime — never hard-code it.
- In mock mode `sdk.sendCommand` is a no-op stub, so generated screens are
  always safe to run without real hardware.

### Telemetry

```ts
import { useDeviceTelemetry } from "@/hooks/useDeviceTelemetry";

const t = useDeviceTelemetry(device.id);
// t.live    → latest reading (live WS)
// t.history → array for charts
// t.isLoading
```

---

## 5. Design-system rules (non-negotiable)

Generated screens must look professional **by construction**. Follow these:

- **Compose from `@/components/blocks`** — `Section`, `StatusHeader`,
  `MetricTile` / `MetricGrid`, `ToggleTile`, `StepperControl`, plus `Button`,
  `Card`, `Input`, `TelemetryChart`. One import: `from "@/components/blocks"`.
- **Never hard-code colors.** Use Tailwind theme tokens only: `bg-primary`,
  `text-foreground`, `bg-surface`, `text-muted`, `border-border`,
  `text-success`, `text-danger`. They come from `app.config.ts` so the
  manufacturer's brand applies automatically.
- **Mobile-first.** Single column, vertical stack of `Section`s. This runs
  inside Capacitor on phones. No fixed pixel widths, no horizontal scroll.
- **Icons** from `lucide-react`.
- **One hero metric** per screen (`MetricTile size="hero"`), secondary metrics
  in a `MetricGrid`.
- **Optimistic UI** — update local state immediately on a control action, then
  send the command; toast on error (`useToast`).
- Handle **loading** and **empty** states. Never render a blank screen.
- The screen owns everything **below the app header**; the app adds the
  Settings + Remove footer itself. Do not add your own header or remove button.

---

## 6. The reference example

`src/screens/device/examples/SmartThermostatScreen.tsx` is the **quality bar**.
It is hand-crafted and registered to the mock demo product. Open it, read it,
and match its structure, polish, comment style, and patterns. When in doubt,
imitate it.

---

## 7. File conventions

```
src/screens/device/
├── types.ts                       ← DeviceScreenProps (don't edit)
├── productScreenRegistry.ts       ← register each generated screen here
├── examples/
│   └── SmartThermostatScreen.tsx  ← reference — don't delete
└── <product-slug>/
    └── <ProductName>Screen.tsx    ← you generate these
```

- Slug = kebab-case product name (`camper-van`, `aura-hydroponics`).
- One folder per product; split into sub-components if a screen gets large.
- Put product-specific helpers/types in that folder, not in `src/lib`.

---

## 8. Do / Don't

**Do**
- Run `npm run inspect` and read the spec before generating.
- Ask the manufacturer when the spec is incomplete.
- Tailor layout + language to the product's domain and category.
- Verify with `npm run build` and fix all type errors.

**Don't**
- Render `dashboard_config` JSON or rebuild the canvas dashboard.
- Hard-code colors, device ids, or command/action names.
- Touch the foundation (`src/auth`, `src/lib`, onboarding, list screens)
  unless the manufacturer explicitly asks.
- Add an AI/runtime dependency — generation happens here, with you, now.
- Report done before the build is green.
