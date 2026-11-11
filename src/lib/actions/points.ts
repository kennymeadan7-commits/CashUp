"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-guard";
import { MIN_POINTS_CONVERSION, POINTS_VALUE_FCFA } from "@/lib/constants";
import { generateVoucherCode } from "@/lib/points";
import {
  notify,
  pointsConvertedNotification,
  voucherUsedNotification,
} from "@/lib/notifications";
import { checkRateLimit, hitRateLimit } from "@/lib/rate-limit";
import { back, ok, str, toInt, waitMessage } from "@/lib/actions/shared";

export type PointsState = { error?: string };

const MAX_CODE_ATTEMPTS = 5;
const CONVERSION_WINDOW_MS = 10 * 60 * 1000;
const CONVERSION_LIMIT = 6;

/**
 * Convertit des points de fidélité en bon d'achat (1 point = 1 FCFA).
 * Le solde est recontrôlé dans la transaction : deux conversions
 * simultanées ne peuvent pas dépasser les points disponibles.
 */
export async function convertPointsAction(
  _prev: PointsState,
  formData: FormData,
): Promise<PointsState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/connexion?next=${encodeURIComponent("/tableau-de-bord/points")}`);
  }
  if (user.suspended) {
    return { error: "Ce compte est suspendu." };
  }

  const amount = toInt(str(formData, "amount"));
  if (amount === null || amount < MIN_POINTS_CONVERSION) {
    return { error: `La conversion minimum est de ${MIN_POINTS_CONVERSION} points.` };
  }

  // Limite de débit : évite les conversions en rafale (script ou erreur).
  const rateKey = `points:${user.id}`;
  const retryAfter = checkRateLimit(rateKey, CONVERSION_LIMIT, CONVERSION_WINDOW_MS);
  if (retryAfter !== null) return { error: waitMessage(retryAfter) };
  hitRateLimit(rateKey, CONVERSION_WINDOW_MS);

  let failure: string | null = null;

  const created = await prisma.$transaction(async (tx) => {
    const [earned, spent] = await Promise.all([
      tx.pointTransaction.aggregate({
        where: { userId: user.id, kind: "EARN" },
        _sum: { amount: true },
      }),
      tx.pointTransaction.aggregate({
        where: { userId: user.id, kind: "SPEND" },
        _sum: { amount: true },
      }),
    ]);
    const available = (earned._sum.amount ?? 0) - (spent._sum.amount ?? 0);

    if (amount > available) {
      failure = `Solde de points insuffisant : ${Math.max(0, available)} points disponibles.`;
      return null;
    }

    // Unicité du code de bon : nouvelle tentative en cas de collision.
    let code = generateVoucherCode();
    for (let attempt = 1; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const existing = await tx.voucher.findUnique({ where: { code } });
      if (!existing) break;
      code = generateVoucherCode();
    }

    const voucher = await tx.voucher.create({
      data: {
        userId: user.id,
        code,
        pointsCost: amount,
        value: amount * POINTS_VALUE_FCFA,
        status: "ACTIVE",
      },
    });

    await tx.pointTransaction.create({
      data: {
        userId: user.id,
        kind: "SPEND",
        amount,
        label: `Conversion en bon d'achat ${voucher.code}`,
        voucherId: voucher.id,
      },
    });

    return { code: voucher.code, value: voucher.value };
  });
  if (failure) return { error: failure };

  if (created) {
    await notify({
      userId: user.id,
      recipient: { email: user.email, phone: user.phone },
      content: pointsConvertedNotification({
        name: user.name,
        points: amount,
        value: created.value,
        code: created.code,
      }),
    });
  }

  revalidatePath("/tableau-de-bord");
  revalidatePath("/tableau-de-bord/points");
  ok(
    "/tableau-de-bord/points",
    `${amount} points convertis : votre bon d'achat de ${amount * POINTS_VALUE_FCFA} FCFA est prêt.`,
  );
}

/** Marque un bon d'achat comme utilisé chez un partenaire (admin). */
export async function markVoucherUsedAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = str(formData, "voucherId");
  const voucher = id
    ? await prisma.voucher.findUnique({
        where: { id },
        include: { user: { select: { name: true, email: true, phone: true } } },
      })
    : null;
  if (!voucher) back("/admin/bons", "Bon d'achat introuvable.");
  if (voucher.status !== "ACTIVE") back("/admin/bons", "Ce bon a déjà été utilisé.");

  await prisma.voucher.update({
    where: { id: voucher.id },
    data: { status: "USED", usedAt: new Date() },
  });

  await notify({
    userId: voucher.userId,
    recipient: { email: voucher.user.email, phone: voucher.user.phone },
    content: voucherUsedNotification({
      name: voucher.user.name,
      code: voucher.code,
      value: voucher.value,
    }),
  });

  revalidatePath("/admin/bons");
  revalidatePath("/tableau-de-bord/points");
  ok(
    "/admin/bons",
    `Bon ${voucher.code} marqué comme utilisé : ${voucher.value} FCFA déduits chez le partenaire.`,
  );
}