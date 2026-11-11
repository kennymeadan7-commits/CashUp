export type Role = "MEMBER" | "ADMIN" | "MARCHAND";

export function isAdmin(role: string | null | undefined): boolean {
  return role === "ADMIN";
}

/** Un marchand (ou un admin) confirme les paiements depuis /marchand. */
export function isMarchand(role: string | null | undefined): boolean {
  return role === "MARCHAND" || role === "ADMIN";
}

export function dashboardPath(role: string | null | undefined): string {
  if (role === "ADMIN") return "/admin";
  if (role === "MARCHAND") return "/marchand";
  return "/tableau-de-bord";
}
