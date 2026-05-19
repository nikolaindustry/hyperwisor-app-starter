# Hyperwisor App Starter

A white-label user-facing IoT app boilerplate for **Hyperwisor manufacturers**.
Clone it, edit one config file, and ship a working web + mobile app for your
device line.

- Web (Vite + React 18 + TS) and native (Capacitor → Android + iOS) from one codebase
- Wired to the Hyperwisor manufacturer API + WebSocket realtime relay
- **Boots in mock mode by default** — runs with fake data until you add real API keys
- Single `app.config.ts` for branding, theme, and mode
- Supports **single-product** (one device line) and **multi-product** (catalog) modes

---

## 5-minute quickstart

```bash
git clone <your-repo> my-brand-app
cd my-brand-app
npm install
npm run dev
```

Open <http://localhost:5173>. You're now signed in as `demo@hyperwisor.com` /
`demo1234` with two pre-loaded fake devices. Tap **Add device → Try a demo QR**
to test the onboarding flow.

### Go live

1. Get your `mk_…` API key and `msk_…` secret key from the Hyperwisor
   manufacturer dashboard.
2. Open [`app.config.ts`](./app.config.ts) and replace:
   ```ts
   apiKey: "DEMO",
   secretKey: "DEMO",
   ```
   with your real values.
3. Restart `npm run dev`. The mock banner disappears; auth and device APIs now
   hit the real backend.

> ⚠ **Don't ship `secretKey` in production mobile binaries.**
> See [`docs/SECURITY.md`](./docs/SECURITY.md) for the proxy-worker pattern.

---

## Pick your mode

In `app.config.ts`:

| Setting | Behavior |
|---|---|
| `mode: "single-product"` + `productId: "<uuid>"` | App is for **one** device line. QR scan rejects other products. Home screen shows a flat device list. |
| `mode: "multi-product"` (default) | App is for a **catalog**. QR scan accepts any of your products. Home screen groups devices by product family. |

---

## What's included

```
src/
├── auth/AuthProvider.tsx        ← session, token storage
├── lib/
│   ├── sdk.ts                   ← THE single API facade (mock/live switch)
│   ├── mock.ts                  ← fake backend for demo mode
│   ├── storage.ts               ← Capacitor Preferences (encrypted on native)
│   ├── theme.ts                 ← applies app.config colors at runtime
│   └── types.ts
├── hooks/
│   ├── useDevices.ts            ← list / add / remove devices
│   └── useDeviceTelemetry.ts    ← live WS feed + historical chart data
├── components/                  ← Logo, DeviceCard, ControlWidget, TelemetryChart, …
└── screens/                     ← all 9 screens (see docs/WIREFRAMES.md)
```

See [`docs/CUSTOMIZATION.md`](./docs/CUSTOMIZATION.md) for theming and
[`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) for native + web builds.

---

## Build for native

```bash
npm run build
npm run cap:add:android   # one-time
npm run cap:run:android
```

iOS is identical with `cap:add:ios` / `cap:run:ios` (Mac + Xcode required).

---

## License

MIT. Fork and ship.
