import Link from "next/link";
import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Wallet } from "lucide-react";
import { avatarColor, initials } from "@/lib/format";
import { statusMeta } from "@/lib/constants";

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  const isSuccess = Boolean(ok) && !error;
  const Icon = isSuccess ? CircleCheck : CircleAlert;
  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm shadow-soft ring-1 ring-inset ${
        isSuccess
          ? "bg-acid-100 text-acid-700 ring-acid-300"
          : "bg-rose-50 text-rose-800 ring-rose-200"
      }`}
    >
      <Icon className="mt-0.5 size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
      <p className="font-medium">{error ?? ok}</p>
    </div>
  );
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const meta = statusMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${meta.className}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {label ?? meta.label}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-cloud-200 bg-white p-4 shadow-soft transition-colors hover:border-brand-200">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold tracking-[0.14em] text-ink-muted uppercase">{label}</p>
        {icon && (
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 ring-inset">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 font-sans text-[clamp(1.5rem,5vw,2.1rem)] leading-[1.05] font-semibold tracking-tight text-ink tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-ink-muted tabular-nums">{hint}</p>}
    </div>
  );
}

export function Avatar({
  name,
  id,
  size = "md",
}: {
  name: string;
  id: string;
  size?: "sm" | "md" | "lg";
}) {
  const dimensions =
    size === "lg" ? "size-16 text-lg" : size === "sm" ? "size-9 text-xs" : "size-12 text-sm";
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-2xl font-bold text-white shadow-sm ${dimensions} ${avatarColor(id)}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon: Icon = Wallet,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-cloud-300 bg-white/70 px-6 py-12 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-cloud-100 text-ink-muted ring-1 ring-cloud-200 ring-inset">
        <Icon className="size-6" strokeWidth={1.7} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-ink-muted">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn btn-primary mt-5">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <Heading className="section-title">{title}</Heading>
        {description && (
          <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-display text-3xl leading-[1.08] font-bold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-2 text-sm leading-relaxed text-ink-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
