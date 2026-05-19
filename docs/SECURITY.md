# Security — Production checklist

The defaults here are tuned for **demos and prototyping**, not production.
Read this before you ship.

## ⚠ Never ship `msk_…` secret keys in mobile binaries

The manufacturer secret key (`msk_…`) is server-grade. Anyone who extracts it
from your APK / IPA can impersonate your manufacturer account.

Two options:

### Option A — Per-user JWT only (recommended)

After sign-in, the app holds the user's Supabase JWT. All app calls go
through endpoints that accept a user JWT instead of manufacturer keys. Today,
the Hyperwisor `/auth/*` endpoints already work this way; for device control
endpoints, set up the proxy below.

### Option B — Thin proxy worker

Host a tiny Cloudflare Worker (or any backend) that holds the `msk_…` key and
forwards requests:

```js
// worker.js
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const targetUrl = `https://cgsuxlbravclbbpnvfky.supabase.co/functions/v1/manufacturer-api${url.pathname}${url.search}`;
    const headers = new Headers(req.headers);
    headers.set("x-api-key", env.HYPERWISOR_API_KEY);
    headers.set("x-secret-key", env.HYPERWISOR_SECRET_KEY);
    return fetch(targetUrl, { method: req.method, headers, body: req.body });
  }
};
```

Then change `apiBaseUrl` in `app.config.ts` to your worker URL, and set
`apiKey` / `secretKey` to empty strings — the worker injects them server-side.

For extra safety, the worker should:
- Verify a user JWT before forwarding (so only your app's users hit it)
- Rate-limit per user ID
- Restrict allowed paths (no need to expose `/products` to end users)

## Token storage

Sessions are stored via `@capacitor/preferences`, which uses:
- iOS: Keychain (encrypted at rest)
- Android: EncryptedSharedPreferences (AES + Keystore)
- Web fallback: `localStorage` (acceptable for the manufacturer's web build,
  not for native)

Never replace `src/lib/storage.ts` with raw `localStorage` on native.

## CORS

The Hyperwisor edge functions already send permissive CORS headers, so a web
build at `https://yourapp.com` will work without a proxy.

## Common mistakes to avoid

- ❌ Committing your real `apiKey` / `secretKey` to git. Use `.env` or build
  pipeline secrets.
- ❌ Logging the user JWT or API keys in production.
- ❌ Allowing `manualDeviceEntry: true` if the QR payload is treated as
  trusted — manual input is user-controlled. The current code validates the
  product server-side, which is correct.
- ❌ Relying on client-side single-product validation as a security boundary.
  Always enforce it on your backend rule layer.
