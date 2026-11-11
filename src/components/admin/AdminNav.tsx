"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Percent,
  Receipt,
  Send,
  ShoppingBag,
  Star,
  Store,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";
import { formatNumber } from "@/lib/format";

type Item = {
  href: string;
  label: string;
  count?: number;
};

const ICONS: Record<string, LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/achats": ShoppingBag,
  "/admin/retraits": Receipt,
  "/admin/boutiques": Store,
  "/admin/utilisateurs": Users,
  "/admin/revenus": Percent,
  "/admin/bons": Star,
  "/admin/outbox": Send,
};

export function AdminNav({ items }: { items: Item[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="hide-scrollbar -mx-1 mt-6 flex gap-1.5 overflow-x-auto border-b border-cloud-200 pb-px"
      aria-label="Navigation administration"
    >
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
        const Icon = ICONS[item.href] ?? LayoutDashboard;
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
            {typeof item.count === "number" && item.count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  active ? "bg-brand-100 text-brand-800" : "bg-cloud-100 text-ink-soft"
                }`}
              >
                {formatNumber(item.count)}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
