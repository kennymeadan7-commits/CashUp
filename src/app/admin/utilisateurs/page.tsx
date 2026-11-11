import type { Metadata } from "next";
import { Ban, CheckCircle2, Search, ShieldCheck, UserRound } from "lucide-react";
import { prisma } from "@/lib/db";
import { toggleSuspendAction } from "@/lib/actions/users";
import { Flash, PageHeader, StatusBadge } from "@/components/ui";
import { avatarColor, formatDate, formatFCFA, initials } from "@/lib/format";
import { getWallet } from "@/lib/wallet";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Utilisateurs",
};

const FILTERS = [
  { value: "ALL", label: "Tous" },
  { value: "MEMBER", label: "Membres" },
  { value: "ADMIN", label: "Administrateurs" },
  { value: "SUSPENDED", label: "Suspendus" },
];

type SearchParams = Promise<{
  ok?: string;
  erreur?: string;
  filtre?: string;
  q?: string;
}>;

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const flash = await searchParams;

  const filtre = FILTERS.some((f) => f.value === flash.filtre) ? flash.filtre! : "ALL";
  const q = (flash.q ?? "").trim().slice(0, 60);

  const users = await prisma.user.findMany({
    where: {
      ...(filtre === "MEMBER" ? { role: "MEMBER" as const } : {}),
      ...(filtre === "ADMIN" ? { role: "ADMIN" as const } : {}),
      ...(filtre === "SUSPENDED" ? { suspended: true } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { purchases: true, withdrawals: true } },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });

  // Soldes agrégés pour les utilisateurs affichés.
  const balances = await Promise.all(users.map((user) => getWallet(user.id)));

  return (
    <>
      <PageHeader
        eyebrow="Comptes"
        title="Utilisateurs"
        description="Consultez les comptes, leurs soldes et suspendez un membre si nécessaire (ses sessions sont fermées immédiatement)."
      />

      <div className="mt-6 space-y-4">
        <Flash ok={flash.ok} error={flash.erreur} />
      </div>

      <form
        method="get"
        className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-cloud-200 bg-white p-4 shadow-soft"
      >
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            maxLength={60}
            className="field pl-10"
            placeholder="Rechercher par nom, e-mail ou téléphone…"
            aria-label="Rechercher un utilisateur"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="submit"
              name="filtre"
              value={filter.value}
              className={`btn btn-sm ${filtre === filter.value ? "btn-primary" : "btn-secondary"}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <button type="submit" className="btn btn-dark btn-sm">
          Rechercher
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {users.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-cloud-300 bg-white/70 px-6 py-12 text-center">
            <UserRound className="mx-auto size-6 text-ink-muted" strokeWidth={1.7} aria-hidden="true" />
            <h3 className="mt-3 text-lg font-bold text-ink">Aucun utilisateur</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Essayez un autre filtre ou une autre recherche.
            </p>
          </div>
        ) : (
          users.map((user, index) => {
            const wallet = balances[index];
            return (
              <article key={user.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={`grid size-11 shrink-0 place-items-center rounded-xl text-xs font-bold text-white ${avatarColor(user.id)}`}
                      aria-hidden="true"
                    >
                      {initials(user.name)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-ink">{user.name}</p>
                        {user.role === "ADMIN" && (
                          <span className="pill inline-flex items-center gap-1 bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700 ring-1 ring-brand-100 ring-inset">
                            <ShieldCheck className="size-3" strokeWidth={2.2} aria-hidden="true" />
                            Admin
                          </span>
                        )}
                        {user.suspended ? (
                          <span className="pill bg-rose-100 px-2 py-0.5 text-[10px] text-rose-700 ring-1 ring-rose-200 ring-inset">
                            Suspendu
                          </span>
                        ) : (
                          <span className="pill bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800 ring-1 ring-emerald-200 ring-inset">
                            Actif
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-ink-muted">
                        {user.email} · {user.phone} · {user.city}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        Inscrit le {formatDate(user.createdAt)} · {user._count.purchases} achat
                        {user._count.purchases > 1 ? "s" : ""} · {user._count.withdrawals} retrait
                        {user._count.withdrawals > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 text-right">
                    <span className="text-sm font-bold text-ink tabular-nums">
                      {formatFCFA(wallet?.balance ?? 0)}
                    </span>
                    <span className="text-[11px] text-ink-muted tabular-nums">
                      dont {formatFCFA(wallet?.pendingWithdrawals ?? 0)} en attente de retrait
                    </span>
                    <StatusBadge
                      status={user.suspended ? "REJECTED" : "APPROVED"}
                      label={user.suspended ? "Suspendu" : "Actif"}
                    />
                  </div>
                </div>

                {user.role === "MEMBER" && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-cloud-100 pt-3">
                    <p className="text-xs text-ink-muted">
                      {user.suspended
                        ? "Ce compte ne peut plus se connecter ; réactivez-le pour lui redonner accès."
                        : "La suspension ferme toutes les sessions actives du compte."}
                    </p>
                    <form action={toggleSuspendAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <button
                        type="submit"
                        className={`btn btn-sm ${user.suspended ? "btn-primary" : "btn-secondary"}`}
                      >
                        {user.suspended ? (
                          <>
                            <CheckCircle2 className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
                            Réactiver
                          </>
                        ) : (
                          <>
                            <Ban className="size-3.5" strokeWidth={2} aria-hidden="true" />
                            Suspendre
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </>
  );
}
