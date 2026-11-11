import Link from "next/link";
import { LogOut, Wallet } from "lucide-react";
import { Logo } from "@/components/Logo";
import { MainNav } from "@/components/MainNav";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { initials } from "@/lib/format";
import { dashboardPath } from "@/lib/roles";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-cloud-200/80 bg-cloud-50/85 shadow-[0_1px_0_rgba(16,20,46,0.04)] backdrop-blur-md supports-[backdrop-filter]:bg-cloud-50/75">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Logo compact={false} />

        <MainNav />

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell userId={user.id} />
              <Link href={dashboardPath(user.role)} className="btn btn-secondary btn-sm">
                <span
                  className="grid size-6 place-items-center rounded-full bg-acid-100 text-[10px] font-bold text-acid-700"
                  aria-hidden="true"
                >
                  {initials(user.name)}
                </span>
                <span className="max-w-28 truncate">
                  {user.role === "ADMIN" ? "Administration" : user.name.split(" ")[0]}
                </span>
                <Wallet className="hidden size-3.5 opacity-60 sm:block" aria-hidden="true" />
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-white hover:text-ink"
                  aria-label="Se déconnecter"
                >
                  <LogOut className="size-4.5" strokeWidth={1.8} aria-hidden="true" />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/connexion" className="btn btn-ghost btn-sm">
                Connexion
              </Link>
              <Link href="/inscription" className="btn btn-primary btn-sm">
                S&apos;inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
