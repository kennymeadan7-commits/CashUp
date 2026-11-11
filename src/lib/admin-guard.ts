import { redirect } from "next/navigation";
import { getCurrentUser, type SessionUser } from "@/lib/auth";

/**
 * Garde d'accès de l'administration.
 * - visiteur non connecté → connexion avec retour vers /admin ;
 * - utilisateur connecté non admin → son espace personnel.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/admin");
  if (user.role !== "ADMIN") redirect("/tableau-de-bord");
  return user;
}
