import Link from "next/link";
import { Bell } from "lucide-react";
import { unreadCount } from "@/lib/notifications";

/** Cloche de notifications (membres et administrateurs) avec compteur. */
export async function NotificationBell({ userId }: { userId: string }) {
  const unread = await unreadCount(userId);
  const label = unread > 0 ? `Notifications (${unread} non lues)` : "Notifications";

  return (
    <Link
      href="/tableau-de-bord/notifications"
      aria-label={label}
      title={label}
      className="relative grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-white hover:text-ink"
    >
      <Bell className="size-4.5" strokeWidth={1.8} aria-hidden="true" />
      {unread > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-brand-600 px-1 py-0.5 text-[10px] font-bold text-white tabular-nums"
          aria-hidden="true"
        >
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
