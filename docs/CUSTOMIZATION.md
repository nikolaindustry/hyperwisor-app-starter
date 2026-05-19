# Customization

Almost everything you need is in [`../app.config.ts`](../app.config.ts).
This guide walks through the rest.

## 1. Branding (the easy 80%)

Edit `app.config.ts`:

```ts
appName: "Acme Smart Home",
bundleId: "com.acme.smarthome",  // change BEFORE first cap:add
logoUrl: "/logo.svg",            // drop into public/, reference by path
supportEmail: "support@acme.com",
```

## 2. Theme colors

Pick your brand palette. Values are CSS variables piped into Tailwind, so
every component picks them up automatically.

```ts
colors: {
  primary: "#0066FF",
  primaryForeground: "#FFFFFF",   // text on primary buttons
  accent: "#00C2A8",
  background: "#FFFFFF",
  surface: "#F5F7FA",             // card / chip backgrounds
  text: "#0A0A0A",
  muted: "#6B7280",
  border: "#E5E7EB",
  success: "#10B981",
  danger: "#EF4444",
},
```

Want dark mode? Add a `colorsDark` block alongside, then set
`document.documentElement.dataset.theme = "dark"` and swap in `theme.ts`.

## 3. Single-product vs multi-product

```ts
// Single device line (e.g. just thermostats):
mode: "single-product",
productId: "abc-123-uuid",   // your product's UUID from the Hyperwisor dashboard

// Catalog (locks + lights + cameras):
mode: "multi-product",
productId: null,
```

This affects:
- **QR onboarding** — single mode rejects QR codes for other products
- **Device list** — single mode shows a flat list; multi mode groups by product

## 4. Feature flags

```ts
features: {
  biometricLogin: false,         // not wired yet, add @capacitor-community/native-biometric
  pushNotifications: false,      // wire @capacitor/push-notifications + your token endpoint
  manualDeviceEntry: true,       // allow text input on Add screen as scan fallback
  sharedDevices: false,          // multi-user sharing — backend support TBD
  showSupportLink: true,
},
```

## 5. Adding a new screen

1. Create `src/screens/MyScreen.tsx`.
2. Add a `<Route>` in `src/App.tsx`.
3. Link to it from wherever (a button, the account screen, etc).

For a new piece of data, add a method to `src/lib/sdk.ts` (and the
matching mock in `src/lib/mock.ts`), then expose it through a hook in
`src/hooks/`.

## 6. Adding a new command widget type

Open `src/components/ControlWidget.tsx`. It branches on `param.type` —
`boolean`, `number`, `enum`, `string`. Add a new case for your custom
type (e.g. `color`, `datetime`) and emit `send(newValue)`.

## 7. Replacing demo data

Open `src/lib/mock.ts`. Change `DEMO_PRODUCT` and `mockDevices` to match
the device line you're prototyping. Keeps the demo realistic for
investor / client walkthroughs before backend is live.

## 8. Logo & splash for native

- Drop your icon as `resources/icon.png` (1024×1024) and splash as
  `resources/splash.png` (2732×2732).
- Run `npx @capacitor/assets generate` to produce all Android + iOS sizes.

## 9. Production secrets

Move credentials out of `app.config.ts` and into env or a proxy worker.
See [`SECURITY.md`](./SECURITY.md).
