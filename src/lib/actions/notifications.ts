"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { str } from "@/lib/actions/shared";

const TARGET = "/tableau-de-bord/notifications";

/** Marque une notification comme lue (le champ `userId` verrouille la cible). */
export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(TARGET)}`);

  const id = str(formData, "id");
  if (id) {
    await prisma.notification.updateMany({
      where: { id, userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
  }

  revalidatePath(TARGET);
}

/** Marque toutes les notifications du membre comme lues. */
export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(TARGET)}`);

  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath(TARGET);
}
