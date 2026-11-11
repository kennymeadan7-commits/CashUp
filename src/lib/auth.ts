import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { User } from "@prisma/client";
import { prisma } from "./db";

export const SESSION_COOKIE = "cashup_session";
const SESSION_DAYS = 30;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { token, userId, expiresAt } });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  store.delete(SESSION_COOKIE);
}

export type SessionUser = Omit<User, "passwordHash">;

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.deleteMany({ where: { id: session.id } });
    return null;
  }

  if (session.user.suspended) {
    await prisma.session.deleteMany({ where: { userId: session.user.id } });
    return null;
  }

  const { passwordHash: _passwordHash, ...user } = session.user;
  return user;
});

/**
 * Utilisateur connecté exigé par une page membre. Le layout redirige aussi,
 * mais layout et page sont rendus en parallèle : ce garde évite qu'une page
 * s'exécute sans utilisateur (et plante sur `user.id`).
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/tableau-de-bord");
  return user;
}
