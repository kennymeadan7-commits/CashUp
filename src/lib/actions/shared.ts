// Helpers partagés par les Server Actions.
// Ce module n'a PAS de directive "use server" : il exporte des fonctions
// synchrones classiques utilisées à l'intérieur des actions.

import { redirect } from "next/navigation";

export function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function toInt(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(/\s/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

/** Redirige vers `path` avec un message d'erreur dans l'URL. */
export function back(path: string, error: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}erreur=${encodeURIComponent(error)}`);
}

/** Redirige vers `path` avec un message de succès dans l'URL. */
export function ok(path: string, message: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}ok=${encodeURIComponent(message)}`);
}

/** Message d'attente générique après dépassement d'une limite de débit. */
export function waitMessage(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  if (minutes <= 1) return "Trop de tentatives. Réessayez dans une minute.";
  return `Trop de tentatives. Réessayez dans ${minutes} minutes.`;
}

/** Convertit une date HTML (AAAA-MM-JJ) en Date, ou null si invalide. */
export function parseDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}
