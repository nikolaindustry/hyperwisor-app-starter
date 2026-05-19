import * as React from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, Pencil } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { sdk } from "@/lib/sdk";
import { useToast } from "@/components/ui/Toast";
import { appConfig, isMockMode } from "@config";
import type { Product } from "@/lib/types";

export function AddDeviceScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const [scanning, setScanning] = React.useState(false);
  const [manualInput, setManualInput] = React.useState("");

  async function handleQrPayload(payload: string) {
    try {
      const res = await sdk.scanQr(payload);
      const product: Product = res.product;

      // Validate against single-product mode
      if (appConfig.mode === "single-product" && appConfig.productId) {
        if (product.id !== appConfig.productId) {
          toast.push("This QR code is for a different product.", "danger");
          return;
        }
      }

      navigate("/add/name", {
        state: {
          product,
          qrInfo: JSON.parse(payload),
        },
      });
    } catch (err) {
      toast.push((err as Error).message || "Could not read QR code", "danger");
    }
  }

  async function startScan() {
    setScanning(true);
    try {
      // Capacitor barcode scanner (native). On web, falls back to manual.
      const isNative =
        // @ts-expect-error capacitor global
        typeof window !== "undefined" && window?.Capacitor?.isNativePlatform?.();

      if (!isNative) {
        toast.push("QR scanning works on device. Use manual entry on web.", "info");
        return;
      }
      // Dynamic import so web builds don't choke on native APIs.
      const mod = await import("@capacitor-community/barcode-scanner");
      const { BarcodeScanner } = mod;
      await BarcodeScanner.checkPermission({ force: true });
      await BarcodeScanner.hideBackground();
      const result = await BarcodeScanner.startScan();
      if (result.hasContent && result.content) {
        await handleQrPayload(result.content);
      }
      await BarcodeScanner.showBackground();
    } catch (err) {
      toast.push((err as Error).message || "Scan failed", "danger");
    } finally {
      setScanning(false);
    }
  }

  function useDemoQr() {
    const payload = JSON.stringify({
      productId: appConfig.productId ?? "demo-product-001",
      manufacturer: "Demo Co",
      model: "ST-2000",
    });
    void handleQrPayload(payload);
  }

  async function submitManual() {
    if (!manualInput.trim()) return;
    await handleQrPayload(manualInput.trim());
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader title="Add device" showBack />
      <main className="flex-1 p-6 flex flex-col gap-6">
        <Card className="text-center py-10">
          <div className="w-20 h-20 rounded bg-primary/10 mx-auto flex items-center justify-center">
            <QrCode size={48} className="text-primary" />
          </div>
          <h2 className="font-semibold mt-4">Scan the QR code on your device</h2>
          <p className="text-muted text-sm mt-1">
            Usually printed on the back of the device or in the packaging.
          </p>
          <Button size="lg" onClick={startScan} loading={scanning} className="mt-6 w-full max-w-xs mx-auto">
            Open scanner
          </Button>
          {isMockMode() ? (
            <Button variant="ghost" size="sm" onClick={useDemoQr} className="mt-3">
              Try a demo QR (mock mode)
            </Button>
          ) : null}
        </Card>

        {appConfig.features.manualDeviceEntry ? (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Pencil size={16} className="text-muted" />
              <h3 className="font-medium">Enter code manually</h3>
            </div>
            <Input
              placeholder='Paste QR contents — e.g. {"productId":"…"}'
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
            />
            <Button onClick={submitManual} className="mt-3 w-full" variant="secondary">
              Continue
            </Button>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
