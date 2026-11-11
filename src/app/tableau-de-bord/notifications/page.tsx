import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CheckCheck, ChevronRight, MailOpen } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listNotifications, unreadCount } from "@/lib/notifications";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";
import { EmptyState, Flash, PageHeader } from "@/components/ui";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications",
};

type SearchParams = Promise<{ ok?: string; erreur?: string }>;

export default async function NotificationsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const flash = await searchParams;
  const [items, unread] = await Promise.all([
    listNotifications(user.id),
    unreadCount(user.id),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Espace membre"
        title="Notifications"
        description="Vos validations de cashback, vos retraits et vos bons d'achat, au même endroit. Les messages importants sont aussi envoyés par e-mail."
      />

      <div className="mt-6 space-y-4">
        <Flash ok={flash.ok} error={flash.erreur} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {unread > 0 ? (
            <>
              <span className="font-semibold text-ink">{unread}</span> non lue
              {unread > 1 ? "s" : ""} sur {items.length}
            </>
          ) : (
            `${items.length} notification${items.length > 1 ? "s" : ""}`
          )}
        </p>

        {unread > 0 && (
          <form action={markAllNotificationsReadAction}>
            <button type="submit" className="btn btn-secondary btn-sm">
              <CheckCheck className="size-3.5" strokeWidth={1.9} aria-hidden="true" />
              Tout marquer comme lu
            </button>
          </form>
        )}
      </div>

      <section className="card mt-4 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Bell}
              title="Aucune notification pour l'instant"
              description="Vous serez prévenu ici — et par e-mail — dès qu'un achat est validé ou qu'un retrait est versé."
            />
          </div>
        ) : (
          <ul className="divide-y divide-cloud-100">
            {items.map((item) => {
              const isUnread = !item.readAt;
              return (
                <li
                  key={item.id}
                  className={`flex flex-wrap items-start gap-3 px-5 py-4 ${
                    isUnread ? "bg-brand-50/50" : ""
                  }`}
                >
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${
                      isUnread ? "bg-brand-600" : "bg-cloud-300"
                    }`}
                    aria-hidden="true"
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm ${
                        isUnread ? "font-bold text-ink" : "font-semibold text-ink-soft"
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs leading-relaxed text-ink-muted">
                      {item.body}
                    </p>
                    <p className="mt-1.5 text-[11px] text-ink-muted">
                      <time dateTime={item.createdAt.toISOString()}>{timeAgo(item.createdAt)}</time>
                      {isUnread ? " · non lue" : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {item.href && (
                      <Link href={item.href} className="btn btn-ghost btn-sm">
                        Ouvrir
                        <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
                      </Link>
                    )}
                    {isUnread && (
                      <form action={markNotificationReadAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          className="btn btn-secondary btn-sm"
                          aria-label={`Marquer « ${item.title} » comme lue`}
                        >
                          <MailOpen className="size-3.5" strokeWidth={1.9} aria-hidden="true" />
                          <span className="hidden sm:inline">Marquer lu</span>
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
