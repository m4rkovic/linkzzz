# LINKZZZ — AUDIT STATUS / ROADMAP REFRESH

**Datum:** 2026-09-05  
**Bazni integracioni commit:** `bd955a2d62efab825334dc2ca7a80e432d5e260b`  
**Radna grana:** `audit/phase3-hardening-20260905`  
**Status validacije grane:** implementation batch; završni mass validation još nije pokrenut.

> Ovo je živi audit ledger nad aktuelnim kodom. Originalni audit i follow-up iz prethodnih dana ostaju istorijski trag, ali više nisu pouzdan opis trenutnog stanja.

---

## 1. Executive status

Originalni kritični problemi oko tenant granica, admin mutacija, quota race-ova, auth hardeninga, analytics ingest-a, Geo/Shield korektnosti, custom-domain lifecycle-a i DB query support-a više nisu dominantni rizik.

Na ovoj grani su implementirani dodatni paketi:

- **Phase 3.10:** observability completion + centralizovan API request-session resolution;
- **Phase 3.11:** public Landing Page server shell + ograničeni client islands;
- **Phase 3.12 expand:** eksplicitna Page/PageCard polja + relacijska gallery asset liveness, uz rollback-compatible legacy dual-write;
- **Phase 4.1:** uklonjen globalni root `connection()` i razdvojen static marketing `/` od dynamic custom-domain runtime-a;
- **Phase 4.2:** CSP policy izolovana po surface-u; production marketing može raditi sa `script-src 'none'`, dok aplikacione/public runtime rute zadržavaju per-request nonce;
- **Phase 5.1:** zajednički accessible `DialogShell`, focus trap/restore, Escape/backdrop politika i nested-dialog zaštita;
- **Phase 5.2:** keyboard tab semantics za analytics period i konzistentniji focus-visible editor navigation;
- **Phase 6.1:** `*.tsbuildinfo` ignorisan i dev prewarm prebačen na opt-in;
- **Phase 6.2:** read-only production deployment smoke za eksterni Vercel/production URL.

Najveći preostali posao pre release candidate-a:

1. mass validacija Prisma migracije i celog implementation batch-a;
2. širi fresh UI contrast/responsive/screen-reader pass;
3. CI gate + formatter politika;
4. production environment/runbook operativna provera;
5. kasniji **Phase 3.12 contract cleanup** tek posle sigurnog compatibility prozora.

---

## 2. Potvrđeno zatvoreno pre ove grane

### Runtime / tenant / concurrency

- Prisma client/pool lifecycle hardenovan;
- custom-domain host/path gating postoji;
- public outbound putanja poštuje Geo/runtime odluke;
- SmartLink kvote imaju server-side concurrency zaštitu;
- admin account/subscription mutacije koriste transakcije + per-user lock;
- last-Landing-Page i related integrity invariants su hardenovani.

### API / validation / analytics

- profile persistence koristi allowlist parser;
- analytics ingest ima rate-limit pre obrade + bounded body;
- typed known errors + safe generic 500 postoje na kritičnim rutama;
- analytics dashboard koristi SQL period summaries;
- subscription access se rešava kroz centralni model;
- query-support kompozitni indeksi su dodati.

### Auth / domains / assets / Shield

- scrypt policy + `needsRehash` + dummy login hash;
- custom-domain PENDING TTL/reclaim/freshness + admin release flow;
- asset quota + orphan sweep;
- Traffic Shield STANDARD/STRICT imaju različitu semantiku;
- verified/known crawler policy je centralizovan.

---

## 3. Phase 3.10 — Observability completion

**Status:** ✅ IMPLEMENTIRANO / ⏳ ČEKA MASS VALIDATION

- typed `InvalidImageError` odvaja user validation od storage/infrastructure failure-a;
- unexpected asset storage/persistence/cleanup failure dobija structured log + request correlation;
- centralizovan request-session helper uklanja cookie/session copy-paste iz API ruta;
- AST contract test sprečava lokalni `catch -> 500` bez logovanja ili rethrow-a;
- expected parse/validation/auth 4xx se namerno ne tretira kao server error spam.

---

## 4. Phase 3.11 — Public renderer decomposition

**Status:** ✅ IMPLEMENTIRANO ARHITEKTONSKI / ⏳ ČEKA BUILD/BROWSER MERENJE

Public SmartLink više ne hidrira kompletan profile renderer kao jedan veliki client boundary.

Server renderuje statički shell:

- page/background;
- hero i identity;
- avatar/name/bio/location;
- socials/stats/visitor messaging;
- footer.

Client islands su ograničeni na stvarno interaktivne delove:

- share/clipboard;
- GA/Meta external click tracking;
- schedule/focus/highlight runtime;
- countdown/email capture/content runtime;
- sticky-header observer.

Editor/preview ostaje client-heavy namerno, jer je interaktivni workspace.

---

## 5. Phase 3.12 — Persistence expand/contract

**Status:** 🟢 EXPAND KORAK IMPLEMENTIRAN / ⏳ ČEKA PRISMA + MIGRATION/E2E VALIDATION  
**Contract cleanup:** ⏸ NAMERNO ODLOŽEN ZA KASNIJI RELEASE

### Novi first-class persistence model

`Page` dobija eksplicitna polja za media/engagement, a `PageCard` za image/availability/sensitive-content/geo runtime podatke. Gallery asset liveness dobija relacijsku tabelu:

`PageContentAssetReference(pageId, blockId, itemId, assetId, sortOrder)`

Asset ownership/liveness više ne zavisi samo od JSON scanner-a.

### Važna rollback korekcija

Prvobitna verzija 3.12 migracije je odmah uklanjala `appearance.__media`, `appearance.__engagement` i PageCard `customStyle.__*` envelope. To bi učinilo rollback na pre-3.12 aplikaciju rizičnim.

Sada je uveden expand/contract model:

1. migracija dodaje nove kolone/relacije;
2. postojeći podaci se backfill-uju;
3. legacy JSON envelope se **ne briše** u ovom release-u;
4. novi repository tokom compatibility prozora dual-write-uje legacy envelope + nova first-class polja;
5. novi reader normalizuje envelope i ne izlaže `__*` ključeve public/domain sloju.

Tek nakon stabilnog production prozora ide zaseban contract release koji prestaje sa legacy read/write i potom uklanja wrapper ključeve.

Ovo je namerno sporije, ali omogućava razuman app rollback.

---

## 6. Phase 4 — CSP / rendering performance

### 4.1 Static marketing vs dynamic runtime

**Status:** ✅ IMPLEMENTIRANO / ⏳ ČEKA BUILD + DEPLOYED SMOKE

- uklonjen root `await connection()`;
- application-host `/` je eksplicitno `force-static`;
- custom-domain `/` se u Proxy sloju interno rewrite-uje na dedicated dynamic runtime route;
- interni `__linkzzz` runtime nije javno dostupan na application host-u;
- auth/dashboard/public SmartLink rute ostaju dinamičke kroz sopstvene `headers/cookies/DB` potrebe.

### 4.2 CSP isolation

**Status:** ✅ IMPLEMENTIRANO / ⏳ ČEKA BROWSER VALIDATION

- dynamic application/public runtime koristi nonce + `strict-dynamic`;
- production marketing `/` nema potrebu za hydration JS i dobija `script-src 'none'`;
- login/navigation sa marketinga radi kao native document navigation i ponovo ulazi u nonce-protected app surface;
- development marketing zadržava lokalni Next HMR runtime;
- CSP contract testovi su dodati.

---

## 7. Phase 5 — UI / Accessibility

### 5.1 Dialog primitive

**Status:** ✅ IMPLEMENTIRANO / ⏳ ČEKA KEYBOARD/MANUAL VALIDATION

Uveden je zajednički `DialogShell` koji centralizuje:

- portal;
- `role=dialog/alertdialog` + `aria-modal`;
- labelled/described wiring;
- initial focus;
- Tab/Shift+Tab trap;
- Escape policy;
- backdrop dismissal policy;
- body scroll lock;
- focus restore;
- nested-dialog zaštitu.

Migrirani su confirm/admin confirm, destination provider picker, change-password, reset-password i suspend-user modali.

### 5.2 Keyboard/focus semantics

**Status:** ✅ PRVI PASS IMPLEMENTIRAN / 🟡 ŠIRI A11Y PASS OSTAJE

- analytics period tabs koriste roving `tabIndex` + Left/Right/Home/End;
- SmartLink editor navigation dobija konzistentan `focus-visible` ring;
- deo sitnog low-contrast navigation teksta je podignut na čitljiviji ton.

Još ostaje fresh pass nad kompletnim trenutnim UI-em za contrast, form hints/errors, screen-reader semantiku i 320/360/390px edge cases.

---

## 8. Phase 6 — Tooling / release engineering

### 6.1 Local DX

**Status:** ✅ IMPLEMENTIRANO

- `*.tsbuildinfo` je u `.gitignore`;
- dev core-route prewarm je OFF by default i uključuje se samo sa `LINKZZZ_DEV_PREWARM=1`.

### 6.2 Deployed production smoke

**Status:** ✅ IMPLEMENTIRANO / ⏳ NIJE POKRENUTO

`e2e/production-smoke.spec.ts` radi protiv već deployovanog URL-a (`E2E_EXTERNAL_SERVER=1`) bez zahteva za disposable E2E bazom.

Smoke proverava:

- marketing `/` + production static CSP;
- native `/ -> /login` navigaciju i nonce CSP login surface-a;
- blokiranje internog custom-domain runtime path-a;
- opcioni public SmartLink runtime preko `E2E_PUBLIC_SMART_LINK_SLUG`.

### Još otvoreno

- GitHub CI gate;
- Prettier/format policy;
- eventualno bundle-size budget posle prvog merenja.

CI trigger se namerno ne uvodi usred ovog draft batch-a samo da automatski vrti testove koje smo eksplicitno odlučili da pokrenemo zajedno na kraju.

---

## 9. Phase 7 — Production readiness

Pre release candidate-a mora postojati operativna potvrda za:

- `dev -> Preview`, `main -> Production` Vercel branch mapping;
- odvojene Preview/Production env vrednosti;
- Neon backup/PITR ili provider snapshot pre DB migracije;
- `prisma migrate deploy`, nikad reset u produkciji;
- Upstash kao production rate-limit backend;
- S3-compatible object storage umesto local adaptera;
- trusted proxy/geo header konfiguraciju;
- custom-domain DNS/SSL lifecycle;
- logging/monitoring i rollback proceduru.

Detaljan redosled treba pratiti iz production release runbook-a u `docs/PRODUCTION_RELEASE_RUNBOOK.md`.

---

## 10. Final mass validation gate

Ovaj draft se ne mergeuje u `dev` dok sledeći paket nije zelen:

1. `npx prisma generate`;
2. migracije na izolovanoj disposable DB;
3. `npm test`;
4. `npm run typecheck`;
5. `npm run lint`;
6. `npm run build`;
7. functional Playwright;
8. keyboard/a11y smoke;
9. visual diff review, bez slepog snapshot update-a;
10. deployed production smoke na Vercel Preview-u;
11. manual desktop/mobile smoke.

Posle prvog zelenog mass gate-a uključuje se stalni GitHub CI quality gate. Nakon production compatibility prozora radi se zaseban Phase 3.12 contract cleanup.

Git je skladište istorije. Nije dokaz da kod radi. Zato ovaj PR ostaje draft dok stvarno ne prođe gate.
