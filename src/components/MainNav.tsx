"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, Store, Wallet, type LucideIcon } from "lucide-react";

const LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/boutiques", label: "Boutiques", icon: Store },
  { href: "/comment-ca-marche", label: "Comment ça marche", icon: HelpCircle },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav
      className="hide-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-1 md:justify-center md:overflow-visible md:px-0"
      aria-label="Navigation principale"
    >
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-white text-ink shadow-sm ring-1 ring-cloud-200 ring-inset"
                : "text-ink-soft hover:bg-white/70 hover:text-ink"
            }`}
          >
            <Icon
              className={`size-4 transition-opacity ${active ? "opacity-100" : "opacity-70"}`}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            {link.label}
          </Link>
        );
      })}
      <Link
        href="/tableau-de-bord"
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors md:hidden ${
          pathname.startsWith("/tableau-de-bord")
            ? "bg-white text-ink shadow-sm ring-1 ring-cloud-200 ring-inset"
            : "text-ink-soft hover:bg-white/70 hover:text-ink"
        }`}
      >
        <Wallet className="size-4" strokeWidth={1.8} aria-hidden="true" />
        Portefeuille
      </Link>
    </nav>
  );
}
