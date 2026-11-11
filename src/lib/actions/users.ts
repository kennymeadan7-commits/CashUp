"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { back, ok, str } from "@/lib/actions/shared";

/** Suspend / réactive un compte membre (admin). Les sessions actives sont fermées. */
export async function toggleSuspendAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const userId = str(formData, "userId");
  if (!userId) back("/admin/utilisateurs", "Utilisateur introuvable.");
  if (userId === admin.id) {
    back("/admin/utilisateurs", "Vous ne pouvez pas suspendre votre propre compte.");
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) back("/admin/utilisateurs", "Utilisateur introuvable.");
  if (target.role === "ADMIN") {
    back("/admin/utilisateurs", "Impossible de suspendre un autre administrateur.");
  }

  const suspended = !target.suspended;

  await prisma.$transaction([
    prisma.user.update({ where: { id: target.id }, data: { suspended } }),
    ...(suspended
      ? [prisma.session.deleteMany({ where: { userId: target.id } })]
      : []),
  ]);

  revalidatePath("/admin/utilisateurs");
  ok(
    "/admin/utilisateurs",
    suspended
      ? `Compte de ${target.name} suspendu : ses sessions sont fermées.`
      : `Compte de ${target.name} réactivé.`,
  );
}
