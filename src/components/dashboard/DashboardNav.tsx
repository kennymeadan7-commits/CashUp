"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, QrCode, Receipt, ShoppingBag, Star, UserRound, Wallet, type LucideIcon } from "lucide-react";

type Item = { href: string; label: string; icon: LucideIcon };

const ITEMS: Item[] = [
  { href: "/tableau-de-bord", label: "Portefeuille", icon: Wallet },
  { href: "/payer", label: "Payer", icon: QrCode },
  { href: "/tableau-de-bord/achats", label: "Mes achats", icon: ShoppingBag },
  { href: "/tableau-de-bord/retraits", label: "Mes retraits", icon: Receipt },
  { href: "/tableau-de-bord/points", label: "Mes points", icon: Star },
  { href: "/tableau-de-bord/notifications", label: "Notifications", icon: Bell },
  { href: "/tableau-de-bord/profil", label: "Mon profil", icon: UserRound },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      className="hide-scrollbar -mx-1 flex gap-1.5 overflow-x-auto border-b border-cloud-200 pb-px"
      aria-label="Navigation de l'espace membre"
    >
      {ITEMS.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/tableau-de-bord" && pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-t-xl border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-ink-soft hover:border-cloud-300 hover:bg-white hover:text-ink"
            }`}
          >
            <Icon className="size-4" strokeWidth={active ? 2.1 : 1.8} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
