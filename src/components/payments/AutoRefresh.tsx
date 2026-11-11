"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Recharge périodiquement la page côté serveur : permet d'afficher la
 * confirmation d'un paiement en temps réel (polling) sans WebSocket.
 */
export function AutoRefresh({ intervalMs = 2000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null;
}
