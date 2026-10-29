import { useEffect, useRef, useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
};

declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

export type VcScannerProps = {
  onResult: (value: string) => void;
  disabled?: boolean;
};

export function VcScanner({ onResult, disabled }: VcScannerProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"starting" | "scanning" | "error">("starting");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  function stop() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    if (!window.BarcodeDetector) {
      setStatus("error");
      toast.error("Barcode scanning is not supported in this browser. Try Chrome on Android.");
      return;
    }

    let cancelled = false;
    setStatus("starting");

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setStatus("scanning");

        const detector = new window.BarcodeDetector!({
          formats: ["code_128", "code_39", "ean_13", "ean_8", "qr_code", "upc_a", "upc_e", "codabar", "itf"],
        });

        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const raw = codes[0]?.rawValue?.trim();
            if (raw) {
              // Keep only digits/alphanumeric, trim to 11 chars for VC No
              const cleaned = raw.replace(/[^A-Za-z0-9]/g, "").slice(0, 11);
              onResult(cleaned);
              toast.success(`Scanned: ${cleaned}`);
              stop();
              return;
            }
          } catch {
            // ignore frame errors, keep scanning
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (e) {
        console.error("[vc-scanner]", e);
        setStatus("error");
        toast.error("Could not access the camera. Please allow camera permission.");
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-label="Scan VC number"
        title="Scan VC number"
        className="shrink-0"
      >
        <Camera className="h-4 w-4" />
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Scan VC number"
        >
          <div className="w-full max-w-sm overflow-hidden rounded-xl bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Scan VC number</p>
              <button
                type="button"
                onClick={stop}
                aria-label="Close scanner"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative aspect-[4/3] bg-black">
              <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
              {status === "starting" && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
              {status === "scanning" && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-24 w-56 rounded-lg border-2 border-emerald-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                </div>
              )}
              {status === "error" && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white">
                  Camera unavailable or scanning not supported in this browser.
                </div>
              )}
            </div>
            <p className="px-4 py-3 text-center text-xs text-muted-foreground">
              Point the camera at the barcode or QR code on the VC card.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
