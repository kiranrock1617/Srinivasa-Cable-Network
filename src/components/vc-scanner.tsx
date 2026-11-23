import { useEffect, useRef, useState } from "react";
import { Camera, X, Loader2, ScanText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Tesseract from "tesseract.js";

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

function extractVcNumber(raw: string): string | null {
  // Remove spaces, dashes, newlines and uppercase
  const compact = raw.toUpperCase().replace(/[\s-]+/g, "");

  // Match T followed by exactly 12 digits (13 chars total, e.g. T403243989171)
  const match = compact.match(/T[0-9OISB]{12}/);
  if (!match) return null;

  // Fix common OCR mistakes in the numeric part
  const digits = match[0]
    .slice(1)
    .replace(/O/g, "0")
    .replace(/I/g, "1")
    .replace(/S/g, "5")
    .replace(/B/g, "8");

  return `T${digits}`;
}

export function VcScanner({ onResult, disabled }: VcScannerProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"starting" | "scanning" | "reading" | "error">("starting");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  function stop() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setOpen(false);
  }

  async function handleScanText() {
    const video = videoRef.current;
    if (!video || status === "reading") return;

    setStatus("reading");
    cancelAnimationFrame(rafRef.current);

    try {
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      // Crop to the center region matching the green guide box
      const cropW = vw * 0.75;
      const cropH = vh * 0.35;
      const cropX = (vw - cropW) / 2;
      const cropY = (vh - cropH) / 2;

      const canvas = document.createElement("canvas");
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");

      ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      const worker = await Tesseract.createWorker("eng");
      await worker.setParameters({
        tessedit_char_whitelist: "T0123456789",
      });
      const { data } = await worker.recognize(canvas);
      await worker.terminate();

      const vc = extractVcNumber(data.text);

      if (vc) {
        onResult(vc);
        toast.success(`Scanned: ${vc}`);
        stop();
      } else {
        toast.error("Couldn't find a 13-character VC number starting with T. Hold steady and try again.");
        setStatus("scanning");
      }
    } catch (e) {
      console.error("[vc-scanner-ocr]", e);
      toast.error("Failed to read text. Please try again.");
      setStatus("scanning");
    }
  }

  useEffect(() => {
    if (!open) return;

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

        // Auto-scan barcodes in background if supported
        if (window.BarcodeDetector) {
          const detector = new window.BarcodeDetector({
            formats: [
              "code_128",
              "code_39",
              "ean_13",
              "ean_8",
              "qr_code",
              "upc_a",
              "upc_e",
              "codabar",
              "itf",
            ],
          });

          const tick = async () => {
            if (cancelled || !videoRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              const raw = codes[0]?.rawValue?.trim();
              if (raw) {
                const vc = extractVcNumber(raw) ?? raw.replace(/[^A-Za-z0-9]/g, "");
                onResult(vc);
                toast.success(`Scanned: ${vc}`);
                stop();
                return;
              }
            } catch {
              // ignore frame errors, keep scanning
            }
            rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
        }
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
              {(status === "starting" || status === "reading") && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-white">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  {status === "reading" && <span className="text-xs">Reading text...</span>}
                </div>
              )}
              {status === "scanning" && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-24 w-64 rounded-lg border-2 border-emerald-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                </div>
              )}
              {status === "error" && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white">
                  Camera unavailable. Please allow camera permission in browser settings.
                </div>
              )}
            </div>

            <div className="space-y-2 px-4 py-3">
              <Button
                type="button"
                onClick={handleScanText}
                disabled={status !== "scanning"}
                className="w-full gap-2"
              >
                <ScanText className="h-4 w-4" />
                {status === "reading" ? "Reading Text..." : "Capture & Read Text"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Barcodes scan automatically. For printed, screen, or written text, align the T-number inside the green box and tap Capture.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}