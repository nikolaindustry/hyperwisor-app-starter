# Deployment

## Web

```bash
npm run build      # outputs dist/
```

Deploy the `dist/` folder to any static host (Cloudflare Pages, Vercel,
Netlify, S3 + CloudFront). No server-side rendering required.

Set `apiBaseUrl` in `app.config.ts` (or a build-time env replacement) to the
correct backend before building.

## Android

One-time setup:

```bash
npm install
npm run build
npm run cap:add:android
```

Develop locally:

```bash
npm run cap:run:android   # builds, syncs, runs on emulator/device
```

Release build:

```bash
npm run build
npx cap sync android
cd android
./gradlew bundleRelease   # AAB for Play Store
```

You'll need:
- Android Studio installed (`ANDROID_HOME` set)
- A keystore — generate once: `keytool -genkey -v -keystore release.keystore …`
- `android/app/build.gradle` configured with `signingConfigs.release`

## iOS

```bash
npm run build
npm run cap:add:ios
npx cap open ios       # opens Xcode
```

In Xcode:
1. Select a development team in **Signing & Capabilities**.
2. Pick a real device or simulator.
3. **Product → Archive** → upload to App Store Connect.

Mac + Xcode 15+ required. CocoaPods auto-installs on first `cap sync ios`.

## Permissions

The QR scanner needs camera permission. Capacitor handles the prompt, but
your stores need the strings:

**iOS** — `ios/App/App/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Scan QR codes on your devices to add them to your account.</string>
```

**Android** — `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
```

The barcode-scanner plugin docs cover the rest.

## App store metadata

Match your `app.config.ts`:
- App name: `appConfig.appName`
- Bundle id / package: `appConfig.bundleId`
- App icon + splash: regenerate from `resources/icon.png` + `resources/splash.png`
  with `npx @capacitor/assets generate`
