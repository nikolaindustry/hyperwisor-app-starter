#!/usr/bin/env node
/**
 * Patch a freshly generated android/ platform.
 *
 * `npx cap add android` produces a platform that cannot provision a device and
 * downloads far more than it needs. The android/ folder is git-ignored —
 * Capacitor regenerates it — so these three fixes cannot live in the repo as
 * files. They live here instead, and this script is idempotent: run it after
 * every `cap add android`, and safely as often as you like.
 *
 *   npm run setup:android
 *
 * What it does, and why each one matters:
 *
 * 1. Cleartext to 192.168.4.1 only.
 *    Provisioning hands Wi-Fi credentials to the device over its own setup
 *    access point, which serves plain HTTP and cannot hold a certificate.
 *    Android 9+ blocks that by default, so without this the flow fails with a
 *    generic "couldn't reach the device" and no way to tell it from being on
 *    the wrong network. Everything else stays HTTPS-only.
 *
 * 2. The CAMERA permission.
 *    Onboarding starts by scanning a QR code.
 *
 * 3. The -bin Gradle distribution instead of -all.
 *    Identical builds; -all adds offline documentation and sources nobody
 *    building an app needs. 131 MB rather than 219 MB, once per machine.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const android = resolve(root, "android");

if (!existsSync(android)) {
  console.error("No android/ folder. Run `npx cap add android` first.");
  process.exit(1);
}

const done = [];
const skipped = [];

/* 1 — network security config ------------------------------------- */

const nscPath = resolve(android, "app/src/main/res/xml/network_security_config.xml");
const nsc = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Device provisioning happens over the device's own Wi-Fi setup AP, which
         only speaks plain HTTP at its SoftAP address. Permit cleartext to that
         one address; everything else stays HTTPS-only.
         See docs/PROVISIONING.md. -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">192.168.4.1</domain>
    </domain-config>
    <base-config cleartextTrafficPermitted="false" />
</network-security-config>
`;
mkdirSync(dirname(nscPath), { recursive: true });
if (existsSync(nscPath) && readFileSync(nscPath, "utf8") === nsc) {
  skipped.push("network_security_config.xml already current");
} else {
  writeFileSync(nscPath, nsc);
  done.push("wrote res/xml/network_security_config.xml");
}

/* 2 — manifest: reference it, and ask for the camera --------------- */

const manifestPath = resolve(android, "app/src/main/AndroidManifest.xml");
let manifest = readFileSync(manifestPath, "utf8");

if (manifest.includes("android:networkSecurityConfig")) {
  skipped.push("manifest already references the network security config");
} else {
  manifest = manifest.replace(
    /(\n\s*android:theme="@style\/AppTheme">)/,
    '\n        android:networkSecurityConfig="@xml/network_security_config"$1',
  );
  done.push("manifest: networkSecurityConfig");
}

if (manifest.includes("android.permission.CAMERA")) {
  skipped.push("manifest already requests CAMERA");
} else {
  manifest = manifest.replace(
    '<uses-permission android:name="android.permission.INTERNET" />',
    `<uses-permission android:name="android.permission.INTERNET" />

    <!-- QR scanning during onboarding. -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />

    <!-- Provisioning needs to see which network the phone is on. -->
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />`,
  );
  done.push("manifest: CAMERA + ACCESS_NETWORK_STATE");
}

writeFileSync(manifestPath, manifest);

/* 3 — the smaller Gradle distribution ------------------------------ */

const wrapperPath = resolve(android, "gradle/wrapper/gradle-wrapper.properties");
if (existsSync(wrapperPath)) {
  const before = readFileSync(wrapperPath, "utf8");
  const after = before.replace(/gradle-([\d.]+)-all\.zip/, "gradle-$1-bin.zip");
  if (after === before) {
    skipped.push("gradle wrapper already uses the -bin distribution");
  } else {
    writeFileSync(wrapperPath, after);
    done.push("gradle wrapper: -all -> -bin");
  }
}

/* ------------------------------------------------------------------ */

for (const line of done) console.log(`  ✓ ${line}`);
for (const line of skipped) console.log(`  · ${line}`);
console.log(
  done.length
    ? "\nAndroid platform patched. Now: npm run build && npx cap sync android"
    : "\nNothing to do — the platform is already patched.",
);
