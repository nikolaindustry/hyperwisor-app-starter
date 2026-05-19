# Wireframes

Each screen has a real running implementation under `src/screens/`. These ASCII
mocks document the layout, the data each screen pulls, and what it does on
interaction. Use them as the spec when handing off to a designer or rebuilding
in another stack.

> Phones are sized at 375×812 (iPhone 13 mini-equivalent). All screens stretch
> to full width on web.

---

## 1. Welcome — `src/screens/WelcomeScreen.tsx`

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│            [ LOGO ]             │
│                                 │
│        Acme Smart Home          │
│  Control your devices, anywhere.│
│                                 │
│                                 │
│                                 │
│  ┌───────────────────────────┐  │
│  │       Sign in             │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │     Create account        │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

Data: none. Pure entry point.

---

## 2. Sign in — `src/screens/SignInScreen.tsx`

```
┌─────────────────────────────────┐
│ Welcome back                    │
│ Sign in to manage your devices. │
│                                 │
│ Email                           │
│ ┌─────────────────────────────┐ │
│ │ demo@hyperwisor.com         │ │
│ └─────────────────────────────┘ │
│ Password                        │
│ ┌─────────────────────────────┐ │
│ │ ••••••••                    │ │
│ └─────────────────────────────┘ │
│                Forgot password? │
│                                 │
│  ┌───────────────────────────┐  │
│  │        Sign in            │  │
│  └───────────────────────────┘  │
│                                 │
│   Don't have an account? Sign up│
└─────────────────────────────────┘
```

API: `POST /auth/signin`. On success, persists session to encrypted storage
and routes to `/devices`.

---

## 3. Sign up — `src/screens/SignUpScreen.tsx`

Identical layout to Sign in plus a **Name** field. Validates password ≥ 8 chars
locally before calling `POST /auth/signup`, then auto-signs the user in.

---

## 4. Device list (empty) — `src/screens/DeviceListScreen.tsx`

```
┌─────────────────────────────────┐
│  My Devices                  👤 │
├─────────────────────────────────┤
│                                 │
│            [ icon ]             │
│        No devices yet           │
│                                 │
│  Scan the QR code on your       │
│  device to add it.              │
│                                 │
│  ┌───────────────────────────┐  │
│  │   Add your first device   │  │
│  └───────────────────────────┘  │
│                                 │
│                            (+)  │
└─────────────────────────────────┘
```

---

## 5. Device list (populated)

```
┌─────────────────────────────────┐
│  My Devices                  👤 │
├─────────────────────────────────┤
│  THERMOSTAT                     │
│  ┌─────────────────────────────┐│
│  │ [T] Living Room Therm.   ●  ││
│  │     Smart Thermostat  Online││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ [T] Bedroom Thermostat   ◌  ││
│  │     Smart Thermostat  5h ago││
│  └─────────────────────────────┘│
│                                 │
│  CAMERA                         │
│  ┌─────────────────────────────┐│
│  │ [C] Front Door Cam       ●  ││
│  │     IP Camera         Online││
│  └─────────────────────────────┘│
│                                 │
│                            (+)  │
└─────────────────────────────────┘
```

In `single-product` mode the section headers are hidden and the list is flat.

API: `GET /onboarding/user/{userId}/devices`. Cached via TanStack Query.

---

## 6. Add device (QR scan) — `src/screens/AddDeviceScreen.tsx`

```
┌─────────────────────────────────┐
│  ←  Add device                  │
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │                             ││
│  │        ▣ QR icon ▣          ││
│  │                             ││
│  │  Scan the QR code on your   ││
│  │  device                     ││
│  │  Usually printed on the back││
│  │                             ││
│  │  ┌──────────────────────┐   ││
│  │  │   Open scanner       │   ││
│  │  └──────────────────────┘   ││
│  │   Try a demo QR (mock)      ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ ✎ Enter code manually       ││
│  │ ┌─────────────────────────┐ ││
│  │ │ Paste QR contents…      │ ││
│  │ └─────────────────────────┘ ││
│  │ ┌─────────────────────────┐ ││
│  │ │       Continue          │ ││
│  │ └─────────────────────────┘ ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

Native: opens `@capacitor-community/barcode-scanner`. Web: only the manual
entry path works (camera scanning is a native concern).

API: `POST /onboarding/scan-qr`.

In single-product mode, mismatched QR codes are rejected client-side.

---

## 7. Name device — `src/screens/NameDeviceScreen.tsx`

```
┌─────────────────────────────────┐
│  ←  Name your device            │
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │ PRODUCT                     ││
│  │ Smart Thermostat            ││
│  │ Model ST-2000               ││
│  └─────────────────────────────┘│
│                                 │
│  Give it a name                 │
│  ┌─────────────────────────────┐│
│  │ Living Room Thermostat      ││
│  └─────────────────────────────┘│
│  You can rename it later.       │
│                                 │
│  ┌───────────────────────────┐  │
│  │       Add device          │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

API: `POST /onboarding/device`. On success → routes to Device Detail.

---

## 8. Device detail — `src/screens/DeviceDetailScreen.tsx`

```
┌─────────────────────────────────┐
│  ←  Living Room Thermostat      │
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │ SMART THERMOSTAT     [● On] ││
│  │ Living Room Thermostat      ││
│  │ ID TH-A1B2C3                ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │       TEMPERATURE           ││
│  │       22.4 °C               ││
│  │       Updated just now      ││
│  └─────────────────────────────┘│
│  Last 24 hours                  │
│  ┌─────────────────────────────┐│
│  │     ╱╲       ╱╲             ││
│  │   ╱╲  ╲   ╱╲╱  ╲╱╲          ││
│  │  ╱     ╲ ╱           ╲      ││
│  └─────────────────────────────┘│
│  Controls                       │
│  ┌─────────────────────────────┐│
│  │ Power           [  Off ]    ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ Target Temperature          ││
│  │ ─────●─────────── 22        ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ Mode  [heat][cool][auto][off]│
│  └─────────────────────────────┘│
│  ⚙ Device settings           ›  │
│  ┌───────────────────────────┐  │
│  │     Remove device         │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

Live data: subscribes to `wss://nikolaindustry-realtime.onrender.com/?id=<userId>`,
filters frames by `device_id`. Historical: `GET /sensor-data?device_id=…`.

The **Controls** section is auto-generated from `product_commands[]` returned
with the device. Manufacturers don't write any code per command — the widget
renders boolean / number / enum / string parameters automatically.

---

## 9. Device settings — `src/screens/DeviceSettingsScreen.tsx`

Read-only info: name, product, model, firmware, device ID, date added.
Future home for rename, sharing, fw-update buttons.

---

## 10. Account — `src/screens/AccountScreen.tsx`

```
┌─────────────────────────────────┐
│  ←  Account                     │
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │ SIGNED IN AS                ││
│  │ Demo User                   ││
│  │ demo@hyperwisor.com         ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ ✉ Contact support           ││
│  │   support@acme.com          ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ ⓘ Acme Smart Home v0.1.0    ││
│  └─────────────────────────────┘│
│  ┌───────────────────────────┐  │
│  │       Sign out            │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

---

## Flow diagram

```
Welcome ──> Sign in ──┬──> Devices ──┬──> Device Detail ──┬──> Settings
                      │              │                    └──> (remove)
        └──> Sign up ─┘              └──> Add ──> Name ────> Device Detail
```
