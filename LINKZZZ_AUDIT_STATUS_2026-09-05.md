# LINKZZZ — AUDIT STATUS / ROADMAP REFRESH

**Datum:** 2026-09-05  
**Bazni integracioni commit:** `bd955a2d62efab825334dc2ca7a80e432d5e260b`  
**Radna grana:** `audit/phase3-hardening-20260905`  
**Status validacije ove grane:** implementation batch; mass validation još nije pokrenut.

> Ovo je živi audit ledger nad aktuelnim kodom. Originalni audit i follow-up više nisu pouzdan opis trenutnog stanja jer je veliki deo nalaza već integrisan ili sada implementiran na ovoj grani.

---

## 1. Executive status

Najveći originalni rizici iz runtime/data-integrity/security faza više nisu dominantni problem. Tenant granice, admin mutacije, kvote, analytics ingest, geo/shield korektnost, custom-domain lifecycle, auth hardening i DB query support su značajno ojačani.

Na ovoj grani su dodatno implementirani:

- **Phase 3.10:** observability completion + centralizovan API request-session resolution;
- **Phase 3.11:** javni Landing Page renderer dobija server-rendered shell i male client runtime islands umesto hidracije kompletnog javnog profila;
- **Phase 3.12:** Page/PageCard media i runtime konfiguracija izlaze iz skrivenih `__*` JSON wrapper ključeva, a gallery asset liveness dobija relacijsku tabelu i FK.

Glavni preostali tehnički dug posle ovog batch-a je:

1. root `connection()` / CSP nonce strategija;
2. preostali širi JSON domain modeli koji su legitimno dokument-style podaci, ali treba proceniti gde se isplati dalja normalizacija;
3. fresh UI/accessibility pass posle nedavnih UI izmena;
4. production-mode smoke E2E, CI i tooling;
5. finalna mass validacija cele grane.

---

## 2. Potvrđeno zatvoreno pre ove grane

### Runtime / tenant / concurrency

- **RT-005** — Prisma client/pool lifecycle hardenovan.
- **RT-002** — custom-domain host/path gating postoji u `src/proxy.ts` i host-routing sloju.
- **RT-003** — public outbound putanja poštuje geo/runtime odluke.
- **RACE-001** — SmartLink kvote imaju server-side concurrency zaštitu.
- **INT-001 / RACE-005** — admin account/subscription mutacije koriste transakcije + per-user lock.
- **INT-105** — admin read i last-Landing-Page invariant su hardenovani.

### API / validation

- **API-002** — profile persistence koristi allowlist parser umesto vraćanja attacker-controlled objekta.
- **API-003/004** — analytics ingest ima rate limit pre obrade i bounded body parsing.
- **API-005 / OBS-002** — typed known errors + safe generic 500 za kritične admin/domain rute.

### Analytics / DB / performance

- **AN-001 / PERF-001/002** — analytics dashboard koristi SQL period summaries umesto lifetime raw-event agregacije u Node-u.
- **SUB-002** — analytics access koristi centralni subscription access model.
- **DB-001** — dodati query-support kompozitni indeksi.
- **INT-102** — DB CHECK: ACTIVE custom domain zahteva `verifiedAt`.
- **PERF-003** — PageCard/Social/Stat writes su batch-ovani.

### Auth / domains / assets / Shield

- custom-domain PENDING TTL, reclaim i verification freshness su implementirani;
- admin domain release + audit flow postoji;
- asset quota i orphan sweeper postoje;
- scrypt policy je podignut i postoji `needsRehash`;
- unknown-account login koristi dummy real-policy hash;
- Traffic Shield STANDARD/STRICT imaju različitu semantiku;
- known social/search crawler-i dobijaju preview po policy-ju.

---

## 3. Phase 3.10 — Observability completion

**Status:** ✅ IMPLEMENTIRANO / ⏳ ČEKA MASS VALIDATION

### Implementirano

- typed `InvalidImageError` odvaja user validation od storage/infrastructure failure-a;
- unexpected asset storage failure → structured log + safe 500;
- asset persistence failure → cleanup + structured log + safe 500;
- rejected storage cleanup više se ne guta kroz `Promise.allSettled`;
- request correlation ID propagira se u custom-domain lokalne error putanje;
- centralizovan request session helper uklanja copy/paste cookie resolution iz API ruta;
- AST contract test sprečava obrazac `catch -> status:500` bez `logServerError` ili rethrow-a.

### Observability invariant

Expected parse/validation/auth 4xx nije error-log događaj. Neočekivani exception koji route lokalno pretvara u 5xx mora biti logovan sa kontekstom ili rethrow-ovan ka Next `onRequestError` hook-u.

---

## 4. Phase 3.11 — Public renderer decomposition

**Status:** ✅ IMPLEMENTIRANO ARHITEKTONSKI / ⏳ ČEKA MASS VALIDATION I BUNDLE MERENJE

### Pre

`public-profile.tsx` je bio `"use client"` boundary oko kompletnog javnog profila. Time su static identity, background, socials, stats, hero, footer i ostatak shell-a ulazili u hydration putanju zajedno sa stvarno interaktivnim delovima.

### Sada

Public runtime koristi novi server component:

- `src/components/public/public-profile-server.tsx`

Server renderuje:

- page shell i background;
- classic identity;
- visual hero/identity shell;
- avatar/name/bio/location;
- socials;
- profile stats;
- visitor messaging;
- footer.

Client islands su izdvojeni po odgovornosti:

- `public-profile-share.tsx` — Web Share / clipboard fallback;
- `public-social-tracking.tsx` — external GA/Meta social-click event delegation;
- `public-profile-link-runtime.tsx` — scheduling/focus/highlight i card interaction;
- `public-profile-content-runtime.tsx` — countdown/scheduled blocks/email-capture runtime;
- `public-visual-sticky-header.tsx` — IntersectionObserver + sticky share UI.

`public-runtime.tsx` sada renderuje `PublicProfileServer` umesto starog full-client `PublicProfile` boundary-ja.

### Napomena

Ovo je arhitektonski split, ali finalnu bundle/hydration uštedu ne proglašavamo dok se ne izmeri production build. Postojeći editor/preview rendereri ostaju client-heavy jer je to opravdan interaktivni workspace, a ne public money-page.

---

## 5. Phase 3.12 — Persistence model cleanup

**Status:** ✅ IMPLEMENTIRANO MIGRACIONO / ⏳ ČEKA PRISMA GENERATE + MIGRATION/E2E VALIDATION

### Uklonjeni skriveni Page JSON wrapper-i

Ranije je `Page.appearance` nosio:

- `__media.avatarUrl`;
- `__media.coverImageUrl`;
- `__engagement`.

Sada postoje eksplicitna polja:

- `Page.avatarUrl`;
- `Page.coverImageUrl`;
- `Page.engagement`.

Migracija backfill-uje postojeće podatke i uklanja te ključeve iz `appearance` JSON-a.

### Uklonjeni PageCard wrapper-i

Ranije je `PageCard.customStyle` bio transportni kontejner:

- `value`;
- `__imageUrl`;
- `__imageAlt`;
- `__availability`;
- `__sensitiveContent`;
- `__geo`.

Sada PageCard direktno ima:

- `imageUrl`;
- `imageAlt`;
- `availability`;
- `sensitiveContent`;
- `geoConfig`;
- `customStyle` sadrži samo stvarni custom-style domain payload.

Migracija podržava i wrapper-format i starije direct-customStyle redove pri backfill-u.

### Gallery/media asset relacija

Dodata je relacijska tabela:

`PageContentAssetReference(pageId, blockId, itemId, assetId, sortOrder)`

sa FK vezama ka `Page` i `Asset`.

Efekti:

- gallery asset više nije "živ" samo zato što literal-key JSON scanner pronađe `imageAssetId`;
- asset cleanup/orphan detection koristi Prisma relacije (`contentFor: none`);
- page save u istoj transakciji rebuild-uje gallery asset references;
- migration backfill-uje reference iz postojećeg `contentBlocks` JSON-a uz ownership join na isti SmartLink;
- asset delete/cleanup više ne zavisi od JSON walker-a za ovaj invariant.

`contentBlocks` ostaje JSON dokument jer heterogeni block payload i dalje ima smisla kao document model. Asset ownership/liveness, međutim, više nije skriven samo u tom dokumentu.

---

## 6. Otvorene velike stavke

### NEXT-002 — root `connection()` / CSP

`src/app/layout.tsx` i dalje koristi `await connection()` zato što `src/proxy.ts` generiše per-request CSP nonce.

Ovo nije bezbedan one-line delete. Sledeća faza mora zajedno da reši:

- nonce strategiju;
- dynamic/static granice;
- third-party tracking CSP zahteve;
- regression test za security headers.

**Prioritet:** HIGH.

### Persistence follow-up

Phase 3.12 uklanja najproblematičniji `__*` transport debt i gallery asset JSON liveness. Preostali JSON (`appearance`, `contentBlocks`, SmartLink configs) treba normalizovati samo tamo gde postoji konkretna potreba za FK/index/query/constraint semantikom, ne zato što je JSON ideološki ružan.

**Prioritet:** MEDIUM.

### UI / Accessibility

Stari audit brojke za contrast/modal fokus više se ne smeju tretirati kao aktuelne jer je UI značajno menjan. Potreban je fresh pass nad trenutnim interfejsom:

- contrast;
- reusable Dialog/focus trap/restore;
- tabs/labels/live errors;
- 320/360/390px edge cases;
- keyboard + screen-reader smoke.

**Prioritet:** MEDIUM-HIGH pre launch-a.

### Tooling / release engineering

- `tsconfig.tsbuildinfo` treba ignorisati;
- Prettier/format check nije uveden;
- production-mode E2E smoke još ne postoji;
- GitHub CI gate treba dodati;
- dev prewarm default treba ponovo proceniti.

**Prioritet:** MEDIUM.

---

## 7. Sledeći roadmap

### Phase 4 — CSP / rendering performance

1. definisati CSP nonce vs static/ISR strategiju;
2. tek zatim ukloniti ili ograničiti root `connection()`;
3. izmeriti public route JS payload/hydration posle Phase 3.11;
4. profilisati public request query count.

### Phase 5 — Persistence / domain follow-up

1. proveriti migration/backfill na realnoj dev kopiji;
2. ukloniti preostale legacy read fallback-e tek kad nema starih redova;
3. normalizovati samo domenske JSON delove kojima treba DB invariant/query support.

### Phase 6 — UI / A11y

1. fresh contrast audit;
2. reusable Dialog primitive;
3. keyboard/focus semantics;
4. responsive edge pass.

### Phase 7 — Tooling / production readiness

1. CI gate;
2. production-mode smoke E2E;
3. Prettier/format check;
4. production env/storage/rate-limit/domain runbook.

### Phase 8 — Final mass validation

Tek kada implementation batch bude završen:

1. `npx prisma generate`;
2. migracije na izolovanoj E2E bazi;
3. `npm test`;
4. `npm run typecheck`;
5. `npm run lint`;
6. production build;
7. functional Playwright;
8. visual regression / snapshot review;
9. manual desktop/mobile smoke.

Do tada ovaj PR ostaje draft i nijedna nova faza se ne proglašava release-ready samo zato što je kod upisan u Git. Git, nažalost, nije QA inženjer.
