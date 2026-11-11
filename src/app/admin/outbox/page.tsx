import type { Metadata } from "next";
import { Inbox, Mail, SearchX, Send } from "lucide-react";
import { prisma } from "@/lib/db";
import { EmptyState, Flash, PageHeader, Stat, StatusBadge } from "@/components/ui";
import { SearchField } from "@/components/admin/SearchField";
import { formatDate, formatNumber, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boîte d'envoi",
};

type SearchParams = Promise<{ ok?: string; erreur?: string; q?: string }>;

export default async function AdminOutboxPage({ searchParams }: { searchParams: SearchParams }) {
  const flash = await searchParams;
  const q = (flash.q ?? "").trim().slice(0, 60);

  const where = q
    ? {
        OR: [
          { to: { contains: q } },
          { subject: { contains: q } },
          { body: { contains: q } },
          { status: { contains: q.toUpperCase() } },
          { channel: { contains: q.toUpperCase() } },
        ],
      }
    : {};

  const [messages, totalCount, sentCount, failedCount] = await Promise.all([
    prisma.messageOutbox.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.messageOutbox.count(),
    prisma.messageOutbox.count({ where: { status: "SENT" } }),
    prisma.messageOutbox.count({ where: { status: "FAILED" } }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Système"
        title="Boîte d'envoi"
        description="Tous les e-mail et SMS déclenchés par la plateforme (validation d'achat, retrait, bon d'achat). Sans fournisseur configuré, les messages restent en file et sont consultables ici."
      />

      <div className="mt-6 space-y-4">
        <Flash ok={flash.ok} error={flash.erreur} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Messages"
          value={formatNumber(totalCount)}
          hint="E-mail et SMS depuis le début"
          icon={<Inbox className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="Envoyés"
          value={formatNumber(sentCount)}
          hint="Remis au fournisseur configuré"
          icon={<Send className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="Échecs"
          value={formatNumber(failedCount)}
          hint="À reprendre : clé absente ou refus"
          icon={<Mail className="size-4.5" strokeWidth={1.9} />}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-cloud-200 bg-cloud-50 px-4 py-3 text-xs leading-relaxed text-ink-muted">
        <span className="font-semibold text-ink">Activation des envois&nbsp;:</span> définissez{" "}
        <code className="font-mono text-ink">RESEND_API_KEY</code> ou{" "}
        <code className="font-mono text-ink">BREVO_API_KEY</code> pour l&apos;e-mail, et{" "}
        <code className="font-mono text-ink">TWILIO_ACCOUNT_SID</code> /{" "}
        <code className="font-mono text-ink">TWILIO_AUTH_TOKEN</code> /{" "}
        <code className="font-mono text-ink">TWILIO_FROM</code> pour le SMS. Sans elles, les
        messages restent « En file d&apos;attente ».
      </div>

      <SearchField
        q={q}
        placeholder="Rechercher par destinataire, objet, contenu ou statut…"
        ariaLabel="Rechercher un message envoyé"
        clearHref="/admin/outbox"
      />

      <section className="card mt-8 p-6">
        <h2 className="text-base font-bold text-ink">
          {q ? `Résultats pour « ${q} »` : "Messages récents"}
        </h2>

        {messages.length === 0 ? (
          <div className="mt-4">
            {q ? (
              <EmptyState
                icon={SearchX}
                title={`Aucun message trouvé pour « ${q} »`}
                description="Essayez une adresse e-mail, un numéro ou un statut (QUEUED, SENT, FAILED)."
              />
            ) : (
              <EmptyState
                icon={Inbox}
                title="Aucun message pour l'instant"
                description="Les notifications envoyées aux membres (validation, retrait, conversion de points) apparaîtront ici."
              />
            )}
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-cloud-100">
            {messages.map((message) => (
              <li key={message.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-cloud-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-ink-soft uppercase">
                        {message.channel === "EMAIL" ? "E-mail" : "SMS"}
                      </span>
                      <p className="font-mono text-xs font-semibold text-ink">{message.to}</p>
                      {message.subject && (
                        <p className="truncate text-xs font-semibold text-ink-soft">
                          {message.subject}
                        </p>
                      )}
                    </div>
                    <p className="mt-1.5 line-clamp-2 whitespace-pre-line text-xs leading-relaxed text-ink-muted">
                      {message.body}
                    </p>
                    {message.error && (
                      <p className="mt-1 font-mono text-[11px] text-rose-700">{message.error}</p>
                    )}
                    <p className="mt-1.5 text-[11px] text-ink-muted">
                      {formatDate(message.createdAt)} · {timeAgo(message.createdAt)}
                      {message.sentAt ? ` · envoyé ${timeAgo(message.sentAt)}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={message.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
