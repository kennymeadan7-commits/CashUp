"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { CITIES } from "@/lib/constants";
import { dashboardPath } from "@/lib/roles";
import { checkRateLimit, clearRateLimit, getClientIp, hitRateLimit } from "@/lib/rate-limit";
import { notify, welcomeNotification } from "@/lib/notifications";
import { str, waitMessage } from "@/lib/actions/shared";

export type AuthState = { error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_IP_LIMIT = 20;
const LOGIN_EMAIL_LIMIT = 8;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;
const REGISTER_IP_LIMIT = 8;

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase();
  const phone = str(formData, "phone").replace(/\s+/g, "");
  const password = str(formData, "password");
  const city = str(formData, "city");

  const ip = await getClientIp();
  const registerKey = `register:${ip}`;
  const retryAfter = checkRateLimit(registerKey, REGISTER_IP_LIMIT, REGISTER_WINDOW_MS);
  if (retryAfter !== null) return { error: waitMessage(retryAfter) };
  hitRateLimit(registerKey, REGISTER_WINDOW_MS);

  if (name.length < 2) return { error: "Indiquez votre nom complet." };
  if (!EMAIL_RE.test(email)) return { error: "Adresse e-mail invalide." };
  if (phone.replace(/\D/g, "").length < 8) return { error: "Numéro de téléphone invalide." };
  if (password.length < 6) return { error: "Le mot de passe doit contenir au moins 6 caractères." };
  if (!CITIES.includes(city)) return { error: "Choisissez votre ville." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Un compte existe déjà avec cette adresse e-mail." };
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      city,
      role: "MEMBER",
      passwordHash: hashPassword(password),
    },
  });

  // Avant la redirection : notify() ne doit pas être interrompu.
  await notify({
    userId: user.id,
    content: welcomeNotification({ name: user.name }),
    recipient: { email: user.email, phone: user.phone },
  });

  await createSession(user.id);
  redirect("/tableau-de-bord?bienvenue=1");
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");
  const next = str(formData, "next");

  if (!email || !password) {
    return { error: "Renseignez votre e-mail et votre mot de passe." };
  }

  const ip = await getClientIp();
  const ipKey = `login-ip:${ip}`;
  const emailKey = `login-email:${email}`;

  const ipRetry = checkRateLimit(ipKey, LOGIN_IP_LIMIT, LOGIN_WINDOW_MS);
  if (ipRetry !== null) return { error: waitMessage(ipRetry) };

  const emailRetry = checkRateLimit(emailKey, LOGIN_EMAIL_LIMIT, LOGIN_WINDOW_MS);
  if (emailRetry !== null) return { error: waitMessage(emailRetry) };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    hitRateLimit(ipKey, LOGIN_WINDOW_MS);
    hitRateLimit(emailKey, LOGIN_WINDOW_MS);
    return { error: "E-mail ou mot de passe incorrect." };
  }

  if (user.suspended) {
    return { error: "Ce compte est suspendu. Contactez l'équipe Cashup pour plus d'informations." };
  }

  clearRateLimit(emailKey);
  await createSession(user.id);

  if (next.startsWith("/") && !next.startsWith("//")) {
    redirect(next);
  }
  redirect(dashboardPath(user.role));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
