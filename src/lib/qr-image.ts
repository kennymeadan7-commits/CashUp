import QRCode from "qrcode";

/**
 * Génère l'image PNG (data URL) d'un QR code.
 * Côté serveur uniquement (node) : utilisé par les pages marchand.
 */
export async function qrDataUrl(payload: string, width = 512): Promise<string> {
  return QRCode.toDataURL(payload, {
    width,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#101828ff", light: "#ffffffff" },
  });
}
