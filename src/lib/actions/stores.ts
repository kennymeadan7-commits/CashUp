"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import {
  CATEGORY_SLUGS,
  CITIES,
  MAX_COMMISSION_RATE,
  MIN_COMMISSION_RATE,
} from "@/lib/constants";
import { back, ok, parseDate, str, toInt } from "@/lib/actions/shared";

export type StoreState = { error?: string };

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function parseRate(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

type StoreInput = {
  name: string;
  slug: string;
  category: string;
  city: string | null;
  address: string | null;
  website: string | null;
  phone: string | null;
  description: string;
  cashbackType: string;
  cashbackRate: number;
  cashbackFixed: number | null;
  commissionRate: number;
  color: string;
  featured: boolean;
  active: boolean;
};

function readStoreInput(formData: FormData): StoreInput | { error: string } {
  const name = str(formData, "name");
  const category = str(formData, "category");
  const cityRaw = str(formData, "city");
  const website = str(formData, "website");
  const phone = str(formData, "phone").replace(/\s+/g, "");
  const description = str(formData, "description");
  const cashbackType = str(formData, "cashbackType") === "FIXED" ? "FIXED" : "PERCENT";
  const cashbackRate = parseRate(str(formData, "cashbackRate"));
  const cashbackFixed = toInt(str(formData, "cashbackFixed"));
  const commissionRate = parseRate(str(formData, "commissionRate"));
  const color = str(formData, "color") || "#4348d8";

  if (name.length < 2) return { error: "Indiquez le nom de la boutique." };
  if (!CATEGORY_SLUGS.includes(category)) return { error: "Choisissez une catégorie." };
  if (description.length < 20) {
    return { error: "Décrivez la boutique en 20 caractères minimum." };
  }
  if (cityRaw && !CITIES.includes(cityRaw)) return { error: "Choisissez une ville valide." };
  if (website && !/^https?:\/\/.+\..+/.test(website)) {
    return { error: "Le site web doit commencer par http:// ou https://." };
  }
  if (phone && phone.replace(/\D/g, "").length < 8) {
    return { error: "Numéro de téléphone invalide." };
  }
  if (!HEX_COLOR_RE.test(color)) return { error: "Couleur au format #RRGGBB attendue." };

  if (cashbackType === "FIXED") {
    if (cashbackFixed === null || cashbackFixed < 50) {
      return { error: "Indiquez un cashback fixe d'au moins 50 FCFA." };
    }
  } else {
    if (cashbackRate === null || cashbackRate < 0.1 || cashbackRate > 100) {
      return { error: "Indiquez un taux de cashback entre 0,1 % et 100 %." };
    }
  }

  if (
    commissionRate === null ||
    commissionRate < MIN_COMMISSION_RATE ||
    commissionRate > MAX_COMMISSION_RATE
  ) {
    return {
      error: `Le taux de commission doit être compris entre ${MIN_COMMISSION_RATE} et ${MAX_COMMISSION_RATE} %.`,
    };
  }

  return {
    name,
    slug: str(formData, "slug") || slugify(name),
    category,
    city: cityRaw || null,
    address: str(formData, "address") || null,
    website: website || null,
    phone: phone || null,
    description,
    cashbackType,
    cashbackRate: cashbackType === "FIXED" ? 0 : Math.round(cashbackRate! * 100) / 100,
    cashbackFixed: cashbackType === "FIXED" ? cashbackFixed : null,
    commissionRate: Math.round(commissionRate * 100) / 100,
    color,
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
  };
}

/** Crée une boutique partenaire (admin). */
export async function createStoreAction(_prev: StoreState, formData: FormData): Promise<StoreState> {
  await requireAdmin();

  const input = readStoreInput(formData);
  if ("error" in input) return { error: input.error };

  const slug = slugify(input.slug);
  if (!slug) return { error: "Slug de boutique invalide." };

  const existing = await prisma.store.findUnique({ where: { slug } });
  if (existing) return { error: "Ce slug est déjà utilisé par une autre boutique." };

  await prisma.store.create({ data: { ...input, slug } });

  revalidatePath("/admin/boutiques");
  revalidatePath("/boutiques");
  ok("/admin/boutiques", `Boutique « ${input.name} » créée.`);
}

/** Met à jour une boutique existante (admin). */
export async function updateStoreAction(_prev: StoreState, formData: FormData): Promise<StoreState> {
  await requireAdmin();

  const id = str(formData, "id");
  const store = id ? await prisma.store.findUnique({ where: { id } }) : null;
  if (!store) return { error: "Boutique introuvable." };

  const input = readStoreInput(formData);
  if ("error" in input) return { error: input.error };

  const slug = slugify(input.slug);
  if (!slug) return { error: "Slug de boutique invalide." };

  const duplicate = await prisma.store.findUnique({ where: { slug } });
  if (duplicate && duplicate.id !== store.id) {
    return { error: "Ce slug est déjà utilisé par une autre boutique." };
  }

  await prisma.store.update({ where: { id: store.id }, data: { ...input, slug } });

  revalidatePath("/admin/boutiques");
  revalidatePath(`/boutiques/${store.slug}`);
  revalidatePath("/boutiques");
  ok("/admin/boutiques", `Boutique « ${input.name} » mise à jour.`);
}

/** Active / désactive une boutique (admin). */
export async function toggleStoreAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = str(formData, "id");
  const store = id ? await prisma.store.findUnique({ where: { id } }) : null;
  if (!store) back("/admin/boutiques", "Boutique introuvable.");

  await prisma.store.update({
    where: { id: store.id },
    data: { active: !store.active },
  });

  revalidatePath("/admin/boutiques");
  revalidatePath("/boutiques");
  revalidatePath(`/boutiques/${store.slug}`);
  ok(
    "/admin/boutiques",
    store.active
      ? `« ${store.name} » est maintenant masquée du catalogue.`
      : `« ${store.name} » est de nouveau visible.`,
  );
}

/** Ajoute une offre à durée limitée (admin). */
export async function createOfferAction(_prev: StoreState, formData: FormData): Promise<StoreState> {
  await requireAdmin();

  const storeId = str(formData, "storeId");
  const title = str(formData, "title");
  const description = str(formData, "description");
  const cashbackType = str(formData, "cashbackType") === "FIXED" ? "FIXED" : "PERCENT";
  const cashbackRate = parseRate(str(formData, "cashbackRate"));
  const cashbackFixed = toInt(str(formData, "cashbackFixed"));
  const startsAt = parseDate(str(formData, "startsAt"));
  const endsAtRaw = str(formData, "endsAt");
  const endsAt = endsAtRaw ? parseDate(endsAtRaw) : null;

  const store = storeId ? await prisma.store.findUnique({ where: { id: storeId } }) : null;
  if (!store) return { error: "Boutique introuvable." };
  if (title.length < 3) return { error: "Indiquez un titre d'offre." };
  if (description.length > 300) return { error: "Description trop longue (300 caractères max)." };
  if (!startsAt) return { error: "Indiquez une date de début." };
  if (endsAtRaw && !endsAt) return { error: "Date de fin invalide." };
  if (endsAt && endsAt.getTime() <= startsAt.getTime()) {
    return { error: "La date de fin doit être postérieure à la date de début." };
  }

  if (cashbackType === "FIXED") {
    if (cashbackFixed === null || cashbackFixed < 50) {
      return { error: "Indiquez un cashback fixe d'au moins 50 FCFA." };
    }
  } else {
    if (cashbackRate === null || cashbackRate < 0.1 || cashbackRate > 100) {
      return { error: "Indiquez un taux de cashback entre 0,1 % et 100 %." };
    }
  }

  await prisma.offer.create({
    data: {
      storeId: store.id,
      title,
      description: description || null,
      cashbackType,
      cashbackRate: cashbackType === "FIXED" ? null : Math.round(cashbackRate! * 100) / 100,
      cashbackFixed: cashbackType === "FIXED" ? cashbackFixed : null,
      startsAt,
      endsAt: endsAt || null,
      active: true,
    },
  });

  revalidatePath("/admin/boutiques");
  revalidatePath(`/boutiques/${store.slug}`);
  ok(`/admin/boutiques/${store.id}`, `Offre « ${title} » ajoutée.`);
}

/** Active / désactive une offre (admin). */
export async function toggleOfferAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = str(formData, "id");
  const offer = id ? await prisma.offer.findUnique({ where: { id }, include: { store: true } }) : null;
  if (!offer) back("/admin/boutiques", "Offre introuvable.");

  await prisma.offer.update({ where: { id: offer.id }, data: { active: !offer.active } });

  revalidatePath("/admin/boutiques");
  revalidatePath(`/boutiques/${offer.store.slug}`);
  ok(
    `/admin/boutiques/${offer.storeId}`,
    offer.active ? "Offre désactivée." : "Offre activée.",
  );
}

/** Supprime une offre (admin). Les achats déjà déclarés conservent leur cashback. */
export async function deleteOfferAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = str(formData, "id");
  const offer = id ? await prisma.offer.findUnique({ where: { id }, include: { store: true } }) : null;
  if (!offer) back("/admin/boutiques", "Offre introuvable.");

  await prisma.offer.delete({ where: { id: offer.id } });

  revalidatePath("/admin/boutiques");
  revalidatePath(`/boutiques/${offer.store.slug}`);
  ok(`/admin/boutiques/${offer.storeId}`, "Offre supprimée.");
}
