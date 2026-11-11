import { redirect } from "next/navigation";
import { getCurrentUser, type SessionUser } from "@/lib/auth";

/**
 * Garde du parcours « Payer » : un membre connecté est exigé, car le cashback
 * est crédité sur son portefeuille. Layout et pages sont rendus en parallèle :
 * ce garde est appelé dans les deux.
 */
export async function requirePayer(pathname = "/payer"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(pathname)}`);
  return user;
}
