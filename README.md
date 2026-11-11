# Cashup 💸

**La plateforme de cashback du Bénin, en FCFA.**

Cashup permet aux membres de déclarer leurs achats chez des commerces partenaires
(supermarchés, pharmacies, restaurants, électronique…), d'encaisser un cashback
validé par l'équipe, puis de retirer leurs gains sur **MTN MoMo**, **Moov Money**
ou **Celtiis Cash**. Chaque achat validé verse aussi des **points de fidélité**,
convertibles en **bons d'achat** chez les partenaires.

- Devise : **FCFA** · Marché : **Bénin** · Langue : **français**
- Comptes : `MEMBER` (membre) et `ADMIN` (back-office)

---

## Démarrage rapide

```bash
cd cashup
npm install        # installe les dépendances + génère le client Prisma
npm run db:reset   # schéma SQLite + base vide + données de démonstration
npm run dev        # http://localhost:3000
```

Si le port 3000 est déjà pris (projet Azɔ) :

```bash
npm run dev -- -p 3100
```

### Comptes de démonstration

| Rôle  | E-mail               | Mot de passe |
| ----- | -------------------- | ------------ |
| Membre | `membre@cashup.bj` | `demo1234`   |
| Admin  | `admin@cashup.bj`   | `demo1234`   |

Le seed crée aussi 13 boutiques (12 actives + 1 masquée), 6 offres, 14 achats,
3 retraits et 3 bons d'achat, avec des écritures de portefeuille, de points et
de commission réalistes (54 255 FCFA de commission au total).

---

## Scripts

| Commande              | Description                                                          |
| --------------------- | -------------------------------------------------------------------- |
| `npm run dev`         | Serveur de développement (génère le schéma SQLite automatiquement)   |
| `npm run build`       | Build de production                                                  |
| `npm run start`       | Sert le build de production                                          |
| `npm run db:reset`    | Régénère le schéma SQLite, réinitialise la base et lance le seed      |
| `npm run db:seed`     | Réinjecte les données de démonstration sans toucher au schéma         |
| `npm run db:push`     | Applique le schéma SQLite à la base locale                            |
| `npm run admin:setup` | Crée / met à jour le compte admin en production (voir `.env.example`) |
| `npm run typecheck`   | Vérifie les types TypeScript (`tsc --noEmit`)                          |
| `npm test`            | Tests Vitest : unitaires + fumée HTTP (auto-skip sans serveur)        |
| `npm run test:watch`  | Tests en mode watch (développement)                                   |

---

## Comment ça marche

```
Achat déclaré (PENDING)
  ├─▶ admin VALIDÉ  (APPROVED)  + crédit du portefeuille (cashback)
  │                                 + commission 10–30 % répartie 50/20/30
  │                                 + points de fidélité (30 % de la commission)
  └─▶ admin REFUSÉ  (REJECTED)  + motif visible par le membre

Retrait demandé (PENDING)
  ├─▶ admin PAYÉ    (PAID)      + débit du portefeuille
  └─▶ admin REJETÉ  (REJECTED)  + fonds débloqués

Conversion de points (dès 1 000 pts, 1 pt = 1 FCFA)
  └─▶ bon d'achat `CU-XXXX-XXXX` → validé en boutique par l'admin
```

Chaque événement du parcours déclenche une **notification** (voir
[Notifications](#notifications--e-mail--sms)) :

- **Solde** = crédits confirmés − débits confirmés
- **Disponible** = solde − retraits en attente (fonds réservés)
- **Cashback** = meilleure règle applicable au moment de l'achat (taux de la
  boutique ou offre boostée en cours) — voir `bestCashbackFor` dans
  `src/lib/wallet.ts`
- **Commission** = taux de la boutique (10–30 %, configurable dans le
  back-office) appliqué au montant de l'achat, répartie à l'approbation :
  **50 % CashUp / 20 % frais / 30 % points** — voir `src/lib/commission.ts`
- **Points** = 30 % de la commission, 1 point = 1 FCFA, convertibles en bons
  d'achat (minimum 1 000 points) — voir `src/lib/points.ts`

### Limites métier

| Règle                     | Valeur             |
| ------------------------- | ------------------ |
| Retrait minimum           | 5 000 FCFA         |
| Achat déclaré             | 500 → 10 000 000 FCFA |
| Ancienneté d'un achat     | 90 jours maximum   |
| Commission partenaire     | 10 % → 30 %        |
| Répartition commission    | 50 % / 20 % / 30 % |
| Valeur d'un point         | 1 FCFA             |
| Conversion minimum        | 1 000 points       |
| Validation / versement    | sous 48 h ouvrées  |
| Frais de retrait          | 0 FCFA             |

---

## Notifications & e-mail / SMS

Trois canaux, un seul déclencheur : une **couche de notifications** branchée
sur les Server Actions métier.

1. **In-app** — modèle `Notification` en base, cloche dans l'en-tête (compteur
   de non-lues) et page `/tableau-de-bord/notifications` (lecture unitaire ou
   « tout marquer comme lu »).
2. **E-mail** — gabarit envoyé par **Resend** (`RESEND_API_KEY`) ou **Brevo**
   (`BREVO_API_KEY`), expéditeur `EMAIL_FROM`.
3. **SMS** — variante courte des gabarits, envoyée par **Twilio**
   (`TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM`).

Les 8 événements notifiés : `WELCOME`, `PURCHASE_APPROVED`,
`PURCHASE_REJECTED`, `WITHDRAWAL_RECEIVED`, `WITHDRAWAL_PAID`,
`WITHDRAWAL_REJECTED`, `POINTS_CONVERTED`, `VOUCHER_USED`.

**Boîte d'envoi** : tout message (e-mail ou SMS) est d'abord écrit dans le
modèle `MessageOutbox`, consultable dans `/admin/outbox` (recherche par
destinataire, objet, contenu, statut). **Sans fournisseur configuré, le
message reste « En file d'attente »** — rien n'est perdu, rien ne casse : on
branche les clés plus tard sans toucher au code.

- Gabarits purs (testés unitairement) : `src/lib/notifications/templates.ts`
- Transport (outbox + fournisseurs) : `src/lib/notifications/transport.ts`
- Orchestration (`notify()`, qui ne lève jamais) : `src/lib/notifications/`
- Variables d'environnement : voir `.env.example`

---

## Pile technique

- **Next.js 16** (App Router, Server Actions, `useActionState`)
- **TypeScript strict**
- **Tailwind CSS 4** (thème `brand` indigo, accent `acid` vert citron, neutres `cloud`, encre `ink`)
- **Prisma 6** — schéma de référence **PostgreSQL** (`prisma/schema.prisma`),
  schéma **SQLite généré** pour le dev local (`prisma/schema.sqlite.prisma`,
  produit par `scripts/make-sqlite-schema.mjs`, ignoré par git)
- **Auth maison** : `scrypt` + sessions en base, cookie `cashup_session`
- **Rate limiting** en mémoire (connexions, inscriptions, conversions de
  points, demandes de retrait)
- **En-têtes de sécurité** en production (`next.config.ts`) : CSP,
  `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, HSTS
- **Confort mobile** : manifest PWA (`src/app/manifest.ts`), meta
  `theme-color` + `appleWebApp`, responsive pensé Mobile Money
- **Chargement fluide** : squelettes `loading.tsx` sur l'accueil, le
  catalogue, le tableau de bord et le back-office
- **Recherche admin** : champ GET réutilisable (`SearchField`) sur les
  utilisateurs, les achats et les bons d'achat
- `lucide-react` pour les icônes

### Production

1. Base **PostgreSQL** managée (Neon, Supabase, Railway…) — renseignez
   `DATABASE_URL` dans `.env` (copie de `.env.example`).
2. `npx prisma migrate deploy` pour appliquer les migrations.
3. `npm run build:prod` puis `npm run start`.
4. Créez le compte admin : `ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run admin:setup`.
5. (Optionnel) Renseignez les clés e-mail/SMS de `.env.example` pour activer
   les envois réels.

---

## Tests & intégration continue

**Vitest** couvre la logique métier pure (aucun navigateur requis) :

| Fichier                          | Sujet                                            |
| -------------------------------- | ------------------------------------------------ |
| `src/lib/__tests__/commission`   | répartition 50/20/30, somme égale à la commission |
| `src/lib/__tests__/wallet`       | règles de cashback (taux, fixe, offres)           |
| `src/lib/__tests__/points`       | codes de bons `CU-XXXX-XXXX` (sans caractères ambigus) |
| `src/lib/__tests__/rate-limit`   | limitation de débit en mémoire                    |
| `src/lib/__tests__/constants`    | limites métier, statuts, Mobile Money, villes     |
| `src/lib/__tests__/format`       | formats FCFA, taux, dates, téléphones béninois    |
| `src/lib/notifications/__tests__`| gabarits des 8 notifications (in-app/e-mail/SMS)  |
| `tests/smoke.test.ts`            | fumée HTTP sur le serveur de production           |

Le test de fumée frappe `SMOKE_BASE_URL` (défaut `http://localhost:3100`) et
**se skippe automatiquement** si le serveur n'est pas lancé : `npm test` passe
donc partout, avec ou sans serveur.

**CI GitHub Actions** (`.github/workflows/ci.yml`) : `npm ci` → génération du
client Prisma → `typecheck` → tests unitaires → `build` → démarrage de
`next start` → tests de fumée complets. La workflow attend le répertoire
`cashup/` : elle s'exécute dès que le projet est poussé dans un dépôt ayant
cette structure.

---

## Structure

```
cashup/
├── .env.example               # variables d'env (e-mail/SMS, base, admin)
├── .github/workflows/ci.yml   # CI : type-check → tests → build → fumée
├── prisma/
│   ├── schema.prisma          # référence PostgreSQL (source de vérité)
│   └── seed.ts                # données de démonstration
├── scripts/
│   ├── make-sqlite-schema.mjs # génère le schéma SQLite local
│   └── setup-admin.mjs        # crée l'admin en production
├── tests/
│   └── smoke.test.ts          # fumée HTTP (skip sans serveur)
├── vitest.config.ts           # alias @ → src, setup, timeout
└── src/
    ├── app/
    │   ├── boutiques/         # catalogue public + fiche boutique
    │   ├── connexion/ inscription/
    │   ├── tableau-de-bord/   # portefeuille, achats, retraits, points,
    │   │                      # notifications, profil
    │   ├── admin/             # vue d'ensemble, achats, retraits,
    │   │                      # boutiques (+ offre), revenus & commissions,
    │   │                      # bons d'achat, utilisateurs, boîte d'envoi
    │   ├── loading.tsx        # squelettes d'attente (racine, boutiques,
    │   │                      # tableau-de-bord, admin)
    │   ├── manifest.ts        # manifest PWA
    │   └── error.tsx          # page d'erreur (panne réseau incluse)
    ├── components/            # UI, formulaires membre & admin,
    │                          # SearchField, cloche de notifications
    └── lib/
        ├── actions/           # Server Actions (auth, achats, retraits,
        │                      # points, notifications)
        ├── notifications/     # gabarits + transport e-mail/SMS + outbox
        ├── __tests__/         # tests unitaires de la logique métier
        ├── auth.ts            # sessions, hachage scrypt, requireUser()
        ├── rate-limit.ts      # limitation de débit en mémoire
        ├── wallet.ts          # soldes et calcul du cashback
        ├── commission.ts      # répartition 50/20/30 de la commission
        ├── points.ts          # points de fidélité et codes de bons
        └── constants.ts       # catégories, villes, limites, statuts, opérateurs
```

---

## Notes

- Aucune donnée bancaire n'est stockée : les retraits partent vers un numéro
  Mobile Money déjà connu du membre.
- Les boutiques ne se suppriment pas : on les **masque** (`active: false`) pour
  préserver l'historique des achats.
- Le projet Azɔ, situé dans le dossier parent, n'est pas impacté.
