"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { Camera, CameraOff, RotateCcw, ScanLine } from "lucide-react";
import { isValidStoreCode, parseQrPayload } from "@/lib/qr";

type Status = "starting" | "scanning" | "error";

const SCAN_INTERVAL_MS = 120;

/**
 * Scanner de QR code CashUp : caméra du navigateur + décodage jsQR.
 * Un QR valide redirige vers /payer?code=XXXX (montant puis PIN).
 */
export function QrScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const foundRef = useRef(false);
  // Compteur de session caméra : invalide les démarrages abandonnés
  // (StrictMode en dev, navigation rapide) pour ne jamais fuiter un flux.
  const runIdRef = useRef(0);

  const [status, setStatus] = useState<Status>("starting");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  const stop = useCallback(() => {
    runIdRef.current += 1;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    const runId = ++runIdRef.current;
    setStatus("starting");
    setError(null);
    setHint(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw Object.assign(new Error("unsupported"), { name: "UnsupportedError" });
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (runIdRef.current !== runId) {
        // Session annulée entre-temps (cleanup / nouvelle tentative).
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setStatus("scanning");

      timerRef.current = setInterval(() => {
        const el = videoRef.current;
        const canvas = canvasRef.current;
        if (!el || !canvas || el.readyState < el.HAVE_ENOUGH_DATA) return;

        const width = el.videoWidth;
        const height = el.videoHeight;
        if (!width || !height) return;

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(el, 0, 0, width, height);

        const image = ctx.getImageData(0, 0, width, height);
        const decoded = jsQR(image.data, width, height, { inversionAttempts: "attemptBoth" });
        if (!decoded?.data) {
          setHint(null);
          return;
        }

        const parsed = parseQrPayload(decoded.data, window.location.origin);
        if (parsed?.code) {
          if (foundRef.current) return;
          foundRef.current = true;
          stop();
          router.push(`/payer?code=${parsed.code}`);
          return;
        }
        setHint("QR reconnu, mais ce n’est pas un QR CashUp.");
      }, SCAN_INTERVAL_MS);
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      stop();
      setStatus("error");
      setError(cameraError(name));
    }
  }, [router, stop]);

  useEffect(() => {
    void start();
    return stop;
  }, [start, stop]);

  const submitManual = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = manualCode.trim();
    if (!isValidStoreCode(code)) {
      setManualError("Le code marchand comporte 4 chiffres (ex. 7842).");
      return;
    }
    setManualError(null);
    router.push(`/payer?code=${code}`);
  };

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="card p-5">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-ink">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`size-full object-cover ${status === "scanning" ? "opacity-100" : "opacity-0"}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {status !== "scanning" && (
            <div className="absolute inset-0 grid place-items-center gap-3 p-6 text-center">
              <div>
                {status === "starting" ? (
                  <ScanLine className="mx-auto size-8 animate-pulse text-white/80" strokeWidth={1.8} aria-hidden="true" />
                ) : (
                  <CameraOff className="mx-auto size-8 text-white/80" strokeWidth={1.8} aria-hidden="true" />
                )}
                <p className="mt-3 text-sm font-semibold text-white">
                  {status === "starting"
                    ? "Démarrage de la caméra…"
                    : "La caméra n’est pas disponible"}
                </p>
                {error && <p className="mt-1.5 text-xs leading-relaxed text-white/70">{error}</p>}
                {status === "error" && (
                  <button type="button" onClick={() => void start()} className="btn btn-primary btn-sm mt-4">
                    <RotateCcw className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
                    Réessayer
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Réticule de visée */}
          {status === "scanning" && (
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-10 rounded-3xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(16,24,40,0.35)]" />
              <p className="absolute inset-x-0 bottom-4 text-center text-xs font-semibold text-white drop-shadow">
                {hint ? (
                  <span className="rounded-full bg-amber-500/90 px-3 py-1">{hint}</span>
                ) : (
                  "Placez le QR du commerçant dans le cadre"
                )}
              </p>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-ink-muted">
          Le scan remplit automatiquement le code marchand, puis vous restez libre du montant
          et du mode de paiement.
        </p>
      </div>

      <div className="space-y-5">
        <div className="card p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-ink">
            <Camera className="size-4.5 text-brand-600" strokeWidth={2} aria-hidden="true" />
            Sans caméra ?
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            Saisissez le code à 4 chiffres affiché sous le QR du commerçant.
          </p>

          <form onSubmit={submitManual} className="mt-4 space-y-3">
            <label htmlFor="manual-code" className="label">
              Code marchand
            </label>
            <input
              id="manual-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
              className="field text-center font-mono text-lg tracking-[0.3em] tabular-nums"
              placeholder="7842"
              autoComplete="off"
            />
            {manualError && <p className="text-xs font-semibold text-red-600">{manualError}</p>}
            <button type="submit" className="btn btn-primary w-full">
              Continuer
              <ScanLine className="size-4" strokeWidth={2.2} aria-hidden="true" />
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-cloud-200 bg-cloud-100/70 p-5">
          <p className="text-sm font-bold text-ink">Où trouver le QR ?</p>
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">
            Le commerçant l&apos;affiche sur sa caisse depuis son espace marchand
            (« Mes QR codes »). Aucun QR sous la main ? Demandez-lui son code à
            4 chiffres.
          </p>
        </div>
      </div>
    </div>
  );
}

function cameraError(name: string): string {
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Accès à la caméra refusé. Autorisez la caméra dans les réglages du navigateur, puis réessayez — ou saisissez le code manuellement.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "Aucune caméra détectée sur cet appareil. Saisissez le code manuellement.";
    case "NotReadableError":
    case "TrackStartError":
      return "La caméra est déjà utilisée par une autre application. Fermez-la puis réessayez.";
    case "SecurityError":
      return "La caméra nécessite une connexion HTTPS (ou localhost). Saisissez le code manuellement.";
    case "UnsupportedError":
      return "Votre navigateur ne permet pas l’accès caméra. Saisissez le code manuellement.";
    default:
      return "Impossible de démarrer la caméra. Saisissez le code manuellement.";
  }
}
