import { describe, expect, it } from "vitest";
import { formatNumber } from "@/lib/format";
import {
  NOTIFICATION_KINDS,
  isNotificationKind,
  pointsConvertedNotification,
  purchaseApprovedNotification,
  purchaseRejectedNotification,
  voucherUsedNotification,
  welcomeNotification,
  withdrawalPaidNotification,
  withdrawalReceivedNotification,
  withdrawalRejectedNotification,
} from "@/lib/notifications/templates";

describe("gabarits de notifications", () => {
  it("expose les huit événements du parcours membre", () => {
    expect(NOTIFICATION_KINDS).toHaveLength(8);
    expect(isNotificationKind("PURCHASE_APPROVED")).toBe(true);
    expect(isNotificationKind("N_EXISTE_PAS")).toBe(false);
  });

  it("produit toujours titre, objet, corps et lien interne", () => {
    const contents = [
      welcomeNotification({ name: "Rachidatou Allassane" }),
      purchaseApprovedNotification({
        name: "Rachidatou Allassane",
        storeName: "Chez Tantie",
        cashback: 800,
        points: 480,
      }),
      purchaseRejectedNotification({
        name: "Rachidatou Allassane",
        storeName: "Chez Tantie",
        reason: "Reçu illisible",
      }),
      withdrawalReceivedNotification({
        name: "Rachidatou Allassane",
        amount: 5_000,
        method: "MTN_MONEY",
      }),
      withdrawalPaidNotification({
        name: "Rachidatou Allassane",
        amount: 5_000,
        method: "MOOV_MONEY",
        phone: "97123456",
      }),
      withdrawalRejectedNotification({
        name: "Rachidatou Allassane",
        amount: 5_000,
        reason: "Numéro invalide",
      }),
      pointsConvertedNotification({
        name: "Rachidatou Allassane",
        points: 1_000,
        value: 1_000,
        code: "CU-7K2M-9QFX",
      }),
      voucherUsedNotification({
        name: "Rachidatou Allassane",
        code: "CU-7K2M-9QFX",
        value: 1_000,
      }),
    ];

    for (const content of contents) {
      expect(content.title.length).toBeGreaterThan(3);
      expect(content.subject.length).toBeGreaterThan(3);
      expect(content.body).toContain("Rachidatou"); // prénom du destinataire
      expect(content.body).toContain("Cashup"); // signature
      expect(content.href).toMatch(/^\//); // lien interne uniquement
      expect(NOTIFICATION_KINDS).toContain(content.kind);
    }
  });

  it("reprend les montants et les codes dans le message", () => {
    const approved = purchaseApprovedNotification({
      name: "Kossi Konan",
      storeName: "Kponli Supermarché",
      cashback: 1_250,
      points: 750,
    });
    expect(approved.title).toContain(formatNumber(1_250));
    expect(approved.body).toContain("Kponli Supermarché");
    expect(approved.body).toContain("750");
    expect(approved.sms).toContain("1250"); // SMS compact (pas d'espace de milliers)

    const converted = pointsConvertedNotification({
      name: "Kossi Konan",
      points: 2_000,
      value: 2_000,
      code: "CU-ABCD-1234",
    });
    expect(converted.body).toContain("CU-ABCD-1234");
    expect(converted.sms).toContain("CU-ABCD-1234");
  });

  it("prévoit un SMS pour les événements qui demandent une action rapide", () => {
    expect(
      purchaseApprovedNotification({ name: "A", storeName: "S", cashback: 10, points: 5 }).sms,
    ).toBeTruthy();
    expect(
      withdrawalPaidNotification({ name: "A", amount: 5_000, method: "MTN_MONEY", phone: "97" })
        .sms,
    ).toBeTruthy();
    expect(welcomeNotification({ name: "A" }).sms).toBeUndefined();
    expect(
      withdrawalReceivedNotification({ name: "A", amount: 5_000, method: "MTN_MONEY" }).sms,
    ).toBeUndefined();
  });

  it("libelle les opérateurs Mobile Money", () => {
    const paid = withdrawalPaidNotification({
      name: "Aïcha",
      amount: 10_000,
      method: "CELTIIS_CASH",
      phone: "97123456",
    });
    expect(paid.title).toContain(formatNumber(10_000));
    expect(paid.body).toContain("Celtiis Cash");
    expect(paid.sms).toContain("Celtiis Cash");
  });
});
