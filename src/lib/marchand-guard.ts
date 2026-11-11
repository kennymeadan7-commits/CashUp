import { redirect } from "next/navigation";
import { getCurrentUser, type SessionUser } from "@/lib/auth";
import { isMarchand } from "@/lib/roles";

/**
 * Garde d'accès à l'espace commerçant (/marchand).
 * - visiteur non connecté → connexion avec retour vers /marchand ;
 * - membre normal → son espace personnel.
 */
export async function requireMarchand(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/marchand");
  if (!isMarchand(user.role)) redirect("/tableau-de-bord");
  return user;
}
