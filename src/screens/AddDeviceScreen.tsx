import * as React from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, ScanLine, Keyboard } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { sdk } from "@/lib/sdk";
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

      if (
        appConfig.mode === "single-product" &&
        appConfig.productId &&
        product.id !== appConfig.productId
      ) {
        toast.push("This QR code is for a different product.", "danger");
        return;
      }

      navigate("/add/name", {
        state: { product, qrInfo: JSON.parse(payload) },
      });
    } catch (err) {
      toast.push((err as Error).message || "Could not read QR code", "danger");
    }
  }

  async function startScan() {
    setScanning(true);
    try {
      const isNative =
        // @ts-expect-error capacitor global
        typeof window !== "undefined" && window?.Capacitor?.isNativePlatform?.();
      if (!isNative) {
        toast.push("QR scanning works on device. Use manual entry on web.", "info");
        return;
      }
      const mod = await import("@capacitor-community/barcode-scanner");
      const { BarcodeScanner } = mod;
      await BarcodeScanner.checkPermission({ force: true });
      await BarcodeScanner.hideBackground();
      const result = await BarcodeScanner.startScan();
      if (result.hasContent && result.content) await handleQrPayload(result.content);
      await BarcodeScanner.showBackground();
    } catch (err) {
      toast.push((err as Error).message || "Scan failed", "danger");
    } finally {
      setScanning(false);
    }
  }

  function useDemoQr() {
    void handleQrPayload(
      JSON.stringify({
        productId: appConfig.productId ?? "demo-product-001",
        manufacturer: "Demo Co",
        model: "ST-2000",
      }),
    );
  }

  async function submitManual() {
    if (!manualInput.trim()) return;
    await handleQrPayload(manualInput.trim());
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader title="Add device" showBack />
      <div className="flex-1 p-4 flex flex-col gap-4">
        {/* Scan hero */}
        <Card className="flex flex-col items-center text-center py-8 px-6">
          <div className="w-[88px] h-[88px] rounded-2xl bg-primary/10 flex items-center justify-center">
            <QrCode size={44} className="text-primary" strokeWidth={1.6} />
          </div>
          <h2 className="font-semibold text-[17px] mt-4">
            Scan your device QR code
          </h2>
          <p className="text-muted text-sm mt-1 max-w-[18rem]">
            It's usually printed on the device or in the box.
          </p>
          <Button
            size="lg"
            onClick={startScan}
            loading={scanning}
            className="mt-5 w-full max-w-xs"
          >
            <ScanLine size={18} />
            Open scanner
          </Button>
          {isMockMode() ? (
            <Button variant="ghost" size="sm" onClick={useDemoQr} className="mt-2">
              Use a demo QR code
            </Button>
          ) : null}
        </Card>

        {/* Manual entry */}
        {appConfig.features.manualDeviceEntry ? (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Keyboard size={16} className="text-muted" />
              <h3 className="font-medium text-sm">Enter code manually</h3>
            </div>
            <Input
              placeholder='Paste QR contents, e.g. {"productId":"…"}'
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
            />
            <Button
              onClick={submitManual}
              variant="secondary"
              className="mt-3 w-full"
              disabled={!manualInput.trim()}
            >
              Continue
            </Button>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
