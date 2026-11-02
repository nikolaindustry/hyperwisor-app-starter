# Provisioning

Getting a device from the box onto the owner's Wi-Fi, and onto the platform.

## Why it takes six steps

A device cannot just connect. The Hyperwisor Secure Channel only accepts
devices whose public key is registered to an account, and a factory-fresh
device has no Wi-Fi credentials — so the first connection it makes is to the
phone, not to the internet.

```
wifi        which network should it join
connect_ap  the PHONE leaves its network and joins the DEVICE's
delivering  one HTTP call hands over the credentials; the device
            replies with its public key
securing    the phone returns to the internet and the key is registered
online      the relay reports the device connected
```

Step 2 is the one that surprises people. The device is an access point at that
moment, with no internet, so the phone has to be on *its* network for exactly
one request. There is no way around it and no way to do it in the background,
which is why the screen asks and waits for confirmation rather than trying to
detect it.

Step 5 is why the key is **queued rather than uploaded**. At the moment the
phone captures it, the phone has no internet. The key is persisted first — it
is a public key, so storing it is not a leak — and sent once the phone is back
on a real network. The queue survives the app being killed and is retried on
sign-in and on app resume.

## Native-only

Provisioning cannot work in a browser. The device's setup page is plain HTTP on
`192.168.4.1`, and a `fetch` from the WebView is blocked by CORS and
mixed-content rules. The request goes through `CapacitorHttp`, which uses the
native stack where those rules do not apply.

In mock mode the flow is simulated so the demo completes — see
`mock.provisionDevice`.

### Android

`android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- The device's setup AP only speaks plain HTTP at its SoftAP address.
         Permit cleartext to that one address; everything else stays
         HTTPS-only. -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">192.168.4.1</domain>
    </domain-config>
    <base-config cleartextTrafficPermitted="false" />
</network-security-config>
```

Reference it from `AndroidManifest.xml`:

```xml
<application android:networkSecurityConfig="@xml/network_security_config" …>
```

### iOS

In `ios/App/App/Info.plist`:

```xml
<key>NSLocalNetworkUsageDescription</key>
<string>This app talks to your device over its own setup Wi-Fi to hand it your
network details. This happens only while you are setting a device up, and only
to the device in front of you.</string>
<key>NSAppTransportSecurity</key>
<dict>
    <!-- Permits cleartext to local/private addresses ONLY. Arbitrary loads
         stay off, so the public internet is still HTTPS-only. -->
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>
```

`NSLocalNetworkUsageDescription` is not optional on iOS 14+. Without it the
local-network permission prompt never appears and the request fails with no
useful error.

## What the device is told

One GET to the device's setup endpoint:

```
http://192.168.4.1/api/provision
  ?ssid=<network>
  &password=<password>
  &target_id=<user_devices row id>
  &user_id=<owner>
  &meta_<key>=<value>      (optional, repeated)
```

`target_id` is the row the app just created and the owner owns — which is what
makes the key registration that follows authorised. The device echoes a success
page containing a `public_key=` parameter; that is what the app reads out.

## Failure, honestly

**The device never reports a wrong Wi-Fi password.** It takes the credentials,
reboots, fails to join, and retries silently. There is no error frame to wait
for, because the device has no way to reach anyone to send one.

So the flow cannot distinguish "wrong password" from "still trying", and it
does not pretend to. After two minutes it says **not seen yet**, explains that
the device keeps retrying on its own, and lists what is worth checking —
2.4 GHz, the password, range.

One consequence worth knowing: a device that has credentials **will not raise
its setup access point again on its own**. Power-cycling it does not help.
Getting back into setup mode means its reset button or mode switch, which is
the manufacturer's to document.

## Presence

Whether a device is connected is answered by the **relay**, from the map it
already keeps, scoped to what the session may see:

```ts
realtime.requestPresence();   // { type: "getConnectedDevices" }
// → { type: "connectedDevices", devices: [...] }
```

Do not send a device a `DEVICE_STATUS` command to answer this. That tests
whether the firmware is free to reply rather than whether the device is
connected, takes seconds, and — being a command — needs the `write` grant, so
it fails outright on a session that only holds `presence`.
