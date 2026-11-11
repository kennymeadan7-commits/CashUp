// Orchestration des notifications : création in-app + mise en file e-mail/SMS.
// Aucune de ces fonctions ne lève : une notification qui échoue ne doit jamais
// faire échouer l'action métier qui l'a déclenchée (validation, retrait…).

import { prisma } from "@/lib/db";
import { dispatchMessage, queueMessage } from "./transport";
import type { NotificationContent } from "./templates";

export * from "./templates";

export type Recipient = { email: string; phone?: string | null };

/**
 * Crée la notification dans l'espace membre puis met le message en file
 * d'envoi (e-mail systématique, SMS si le gabarit en prévoit un).
 */
export async function notify(input: {
  userId: string;
  content: NotificationContent;
  /** Destinataire déjà connu par l'appelant (évite une lecture de plus). */
  recipient?: Recipient;
}): Promise<void> {
  const { content } = input;

  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        kind: content.kind,
        title: content.title,
        body: content.body,
        href: content.href,
      },
    });
  } catch {
    return;
  }

  try {
    let recipient = input.recipient;
    if (!recipient) {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { email: true, phone: true },
      });
      if (!user) return;
      recipient = { email: user.email, phone: user.phone };
    }

    const emailInput = {
      channel: "EMAIL" as const,
      to: recipient.email,
      subject: content.subject,
      body: content.body,
      userId: input.userId,
    };
    const emailId = await queueMessage(emailInput);
    if (emailId) void dispatchMessage(emailId, emailInput).catch(() => {});

    if (content.sms && recipient.phone) {
      const smsInput = {
        channel: "SMS" as const,
        to: recipient.phone,
        body: content.sms,
        userId: input.userId,
      };
      const smsId = await queueMessage(smsInput);
      if (smsId) void dispatchMessage(smsId, smsInput).catch(() => {});
    }
  } catch {
    // best effort : la notification in-app est déjà enregistrée
  }
}

/** Liste des notifications d'un membre, plus récentes d'abord. */
export async function listNotifications(userId: string, take = 50) {
  try {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
    });
  } catch {
    return [];
  }
}

/** Nombre de notifications non lues (badge de la cloche). */
export async function unreadCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({ where: { userId, readAt: null } });
  } catch {
    return 0;
  }
}
