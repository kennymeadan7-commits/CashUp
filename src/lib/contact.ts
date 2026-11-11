// Coordonnées Cashup — source unique pour tout le site.
// (Une seule source : impossible qu'elles divergent d'une page à l'autre.)

export const CONTACT = {
  /** Numéro affiché (format local) */
  phoneDisplay: "41 47 62 94",
  /** Numéro en format international, pour les liens tel: */
  phoneHref: "tel:+22941476294",
  /** Format E.164 sans le « + », pour formatPhone() */
  phoneE164: "+22941476294",
  email: "precieuxyovogan1@gmail.com",
  city: "Cotonou, Bénin",
} as const;
