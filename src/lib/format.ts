const numberFormatter = new Intl.NumberFormat("fr-FR");

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatFCFA(amount: number): string {
  return `${numberFormatter.format(amount)} FCFA`;
}

/** Taux de cashback : 5 → « 5 % » (décimales si nécessaire : 2.5 → « 2,5 % »). */
export function formatRate(rate: number): string {
  const value = Number.isInteger(rate)
    ? String(rate)
    : new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(rate);
  return `${value} %`;
}

/**
 * Affiche un numéro béninois lisible (+229 97 12 34 56) même après
 * normalisation en base (les espaces sont retirés à l'enregistrement).
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("229") && digits.length === 11) {
    return `+229 ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
  }
  if (digits.length === 8) {
    return `+229 ${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)}`;
  }
  return phone;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_PALETTE = [
  "bg-brand-600",
  "bg-[#6d28d9]",
  "bg-[#0e7490]",
  "bg-[#9d174d]",
  "bg-[#4d7c0f]",
  "bg-[#b45309]",
  "bg-[#3730a3]",
  "bg-[#be123c]",
];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  return formatShortDate(d);
}
