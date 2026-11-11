"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { CITIES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { ok, str } from "@/lib/actions/shared";

export type ProfileState = { error?: string };

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/tableau-de-bord/profil");
  return user;
}

/** Met à jour les informations personnelles du compte. */
export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();

  const name = str(formData, "name");
  const phone = str(formData, "phone").replace(/\s+/g, "");
  const city = str(formData, "city");

  if (name.length < 2) return { error: "Indiquez votre nom complet." };
  if (phone.replace(/\D/g, "").length < 8) return { error: "Numéro de téléphone invalide." };
  if (!CITIES.includes(city)) return { error: "Choisissez votre ville." };

  await prisma.user.update({
    where: { id: user.id },
    data: { name, phone, city },
  });

  revalidatePath("/tableau-de-bord/profil");
  ok("/tableau-de-bord/profil", "Vos informations ont été mises à jour.");
}

/** Change le mot de passe (vérification du mot de passe actuel requise). */
export async function changePasswordAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();

  const current = str(formData, "currentPassword");
  const next = str(formData, "newPassword");
  const confirm = str(formData, "confirmPassword");

  if (next.length < 6) {
    return { error: "Le nouveau mot de passe doit contenir au moins 6 caractères." };
  }
  if (next !== confirm) {
    return { error: "La confirmation ne correspond pas au nouveau mot de passe." };
  }

  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record || !verifyPassword(current, record.passwordHash)) {
    return { error: "Mot de passe actuel incorrect." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(next) },
  });

  revalidatePath("/tableau-de-bord/profil");
  ok("/tableau-de-bord/profil", "Votre mot de passe a été modifié.");
}
