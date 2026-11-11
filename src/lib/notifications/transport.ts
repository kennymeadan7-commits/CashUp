// Transport de messages : e-mail et SMS.
//
// Toute tentative est d'abord écrite dans MessageOutbox (consultable dans
// l'administration), puis remise au fournisseur configuré via les variables
// d'environnement :
//
//   e-mail : RESEND_API_KEY  ou  BREVO_API_KEY      (+ EMAIL_FROM)
//   SMS    : TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM
//
// Sans fournisseur, le message reste « QUEUED » : rien n'est perdu et rien
// ne casse (mode démonstration / développement hors ligne).

import { prisma } from "@/lib/db";

export type Channel = "EMAIL" | "SMS";

export type MessageInput = {
  channel: Channel;
  to: string;
  subject?: string;
  body: string;
  userId?: string;
};

const REQUEST_TIMEOUT_MS = 8_000;

function emailFrom(): string {
  return process.env.EMAIL_FROM ?? "Cashup <bonjour@cashup.bj>";
}

function providerFor(channel: Channel): string | null {
  if (channel === "EMAIL") {
    if (process.env.RESEND_API_KEY) return "RESEND";
    if (process.env.BREVO_API_KEY) return "BREVO";
    return null;
  }
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) return "TWILIO";
  return null;
}

async function postJson(url: string, init: RequestInit): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (response.ok) return { ok: true };
    const detail = (await response.text()).slice(0, 300);
    return { ok: false, error: `HTTP ${response.status} — ${detail}` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur réseau" };
  }
}

async function sendResend(input: MessageInput, key: string) {
  return postJson("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: emailFrom(),
      to: [input.to],
      subject: input.subject ?? "Message Cashup",
      text: input.body,
    }),
  });
}

async function sendBrevo(input: MessageInput, key: string) {
  return postJson("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { email: emailFrom().match(/<([^>]+)>/)?.[1] ?? emailFrom(), name: "Cashup" },
      to: [{ email: input.to }],
      subject: input.subject ?? "Message Cashup",
      textContent: input.body,
    }),
  });
}

async function sendTwilio(input: MessageInput) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const body = new URLSearchParams({
    Body: input.body,
    From: process.env.TWILIO_FROM ?? "",
    To: input.to,
  });

  return postJson(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

/**
 * Écrit le message dans l'outbox (opération rapide, toujours awaitée par
 * l'appelant pour garantir qu'il est consultable immédiatement).
 */
export async function queueMessage(input: MessageInput): Promise<string | null> {
  try {
    const created = await prisma.messageOutbox.create({
      data: {
        channel: input.channel,
        to: input.to,
        subject: input.subject ?? null,
        body: input.body,
        userId: input.userId ?? null,
        status: "QUEUED",
      },
    });
    return created.id;
  } catch {
    return null; // base indisponible : on n'interrompt jamais l'action appelante
  }
}

/**
 * Remet un message en attente au fournisseur configuré.
 * Ne lève jamais d'erreur : une panne de fournisseur ne doit pas faire
 * échouer la Server Action qui a déclenché la notification.
 */
export async function dispatchMessage(outboxId: string, input: MessageInput): Promise<void> {
  const provider = providerFor(input.channel);
  if (!provider) return; // mode démonstration : le message reste consultable

  const result =
    input.channel === "EMAIL"
      ? provider === "RESEND"
        ? await sendResend(input, process.env.RESEND_API_KEY!)
        : await sendBrevo(input, process.env.BREVO_API_KEY!)
      : await sendTwilio(input);

  try {
    await prisma.messageOutbox.update({
      where: { id: outboxId },
      data: result.ok
        ? { status: "SENT", sentAt: new Date(), error: null }
        : { status: "FAILED", error: result.error ?? "Envoi impossible" },
    });
  } catch {
    // L'outbox reste en QUEUED : l'admin verra le message en attente.
  }
}

/** File d'attente + envoi immédiat (utilisé par les scripts et les tests). */
export async function deliverMessage(input: MessageInput): Promise<void> {
  const outboxId = await queueMessage(input);
  if (!outboxId) return;
  await dispatchMessage(outboxId, input);
}

