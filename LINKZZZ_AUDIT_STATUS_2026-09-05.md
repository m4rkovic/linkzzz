# LINKZZZ — AUDIT STATUS / ROADMAP REFRESH

**Datum:** 2026-09-05  
**Bazni integracioni commit:** `bd955a2d62efab825334dc2ca7a80e432d5e260b`  
**Radna grana:** `audit/phase3-hardening-20260905`  
**Status validacije grane:** lokalni core + DB-backed functional E2E GREEN; GitHub Actions core + functional E2E GREEN na clean Linux runneru.

> Ovo je živi audit ledger nad aktuelnim kodom. Originalni audit i follow-up ostaju istorijski trag, ali više nisu pouzdan opis trenutnog stanja.

---

## 1. Executive status

Originalni kritični problemi oko tenant granica, admin mutacija, quota race-ova, auth hardeninga, analytics ingest-a, Geo/Shield korektnosti, custom-domain lifecycle-a i DB query support-a više nisu dominantni rizik.

Na ovoj grani su implementirani dodatni paketi:

- **Phase 3.10:** observability completion + centralizovan API request-session resolution;
- **Phase 3.11:** public Landing Page server shell + ograničeni client islands;
- **Phase 3.12 expand:** eksplicitna Page/PageCard polja + relacijska gallery asset liveness, uz rollback-compatible legacy dual-write;
- **Phase 4:** CSP izolacija po surface-u i host-aware root runtime bez krhkog custom-domain internal rewrite-a;
- **Phase 5:** shared dialog/focus primitive + targeted keyboard/form semantics pass;
- **Phase 6.1:** lokalni DX cleanup;
- **Phase 6.2:** deployed production smoke + one-command validation runner;
- **Phase 6.3:** permanent GitHub quality gate sa odvojenim core i disposable-Postgres E2E jobovima.

Pre release candidate-a ostaju:

1. manual desktop/mobile smoke + visual diff review;
2. Vercel Preview deployed production smoke;
3. kasniji **Phase 3.12 contract cleanup** tek posle sigurnog production compatibility prozora.

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

**Status:** ✅ IMPLEMENTIRANO / ✅ UNIT + FUNCTIONAL E2E GREEN

- typed `InvalidImageError` odvaja user validation od storage/infrastructure failure-a;
- unexpected asset storage/persistence/cleanup failure dobija structured log + request correlation;
- centralizovan request-session helper uklanja cookie/session copy-paste iz API ruta;
- AST contract test sprečava lokalni `catch -> 500` bez logovanja ili rethrow-a;
- expected parse/validation/auth 4xx se namerno ne tretira kao server error spam;
- prvi E2E run otkrio je unbound native `Headers.get` i `ERR_INVALID_THIS`; poziv je ispravljen i dodat regression unit test sa pravim `Headers` objektom.

---

## 4. Phase 3.11 — Public renderer decomposition

**Status:** ✅ IMPLEMENTIRANO / ✅ FUNCTIONAL E2E GREEN / ⏳ DEPLOYED + VISUAL REVIEW OSTAJU

Public SmartLink više ne hidrira kompletan profile renderer kao jedan veliki client boundary. Statički identitet, hero, background, socials, stats, visitor messaging i footer renderuju se na serveru. Client islands su ograničeni na share/clipboard, tracking, schedule/focus runtime, content runtime i sticky-header behavior.

Editor/preview ostaje client-heavy namerno, jer je interaktivni workspace.

---

## 5. Phase 3.12 — Persistence expand/contract

**Status:** 🟢 EXPAND KORAK IMPLEMENTIRAN / ✅ DB-BACKED FUNCTIONAL E2E GREEN  
**Contract cleanup:** ⏸ NAMERNO ODLOŽEN ZA KASNIJI RELEASE

`Page` ima eksplicitna media/engagement polja, `PageCard` first-class image/availability/sensitive-content/geo podatke, a gallery asset liveness koristi `PageContentAssetReference`.

Rollback-safe expand pravilo ostaje:

1. nove kolone/relacije se dodaju i backfill-uju;
2. legacy JSON envelope se ne briše u ovom release-u;
3. repository dual-write-uje legacy + first-class reprezentaciju;
4. reader normalizuje legacy envelope pre domain/public sloja;
5. contract cleanup ide kao zaseban kasniji release.

Prvi functional run otkrio je da server pravilno regeneriše ne-owned/client-supplied PageCard ID, ali Page-level `featuredLinkId` i campaign `primaryLinkId` ostaju na starom ID-u. `writePageChildren` sada vraća client-id -> persisted-id mapu, a repository remapuje engagement u istoj transakciji. Targeted i full functional rerun su green.

---

## 6. Phase 4 — CSP / host routing

### 4.1 Host-aware root runtime

**Status:** ✅ IMPLEMENTIRANO / ✅ CUSTOM-DOMAIN PARITY GREEN

Prvobitni `force-static` application root + custom-domain internal rewrite pokazao se krhkim u Next 16 runtime-u. Finalni model je jednostavniji:

- root `/` je host-aware server entrypoint;
- Linkzzz application host renderuje marketing Landing Page;
- ACTIVE custom-domain `/` direktno razrešava i renderuje isti SmartLink runtime kao platform slug;
- custom-domain root ne koristi internal rewrite;
- stara `__linkzzz/custom-domain` runtime ruta je uklonjena;
- application-host `/__linkzzz/*` ostaje blokiran kroz Proxy guard.

Tradeoff: marketing root više nije `force-static`. To je nameran correctness-over-micro-optimization izbor.

### 4.2 CSP isolation

**Status:** ✅ IMPLEMENTIRANO / ✅ CORE TESTOVI GREEN

- dynamic application/public runtime koristi nonce + `strict-dynamic`;
- production marketing surface koristi strožu script politiku jer nema obaveznu hydration funkcionalnost;
- development marketing zadržava Next HMR runtime;
- CSP testovi proveravaju `script-src` direktivu, dok `style-src` još namerno koristi `unsafe-inline`.

---

## 7. Phase 5 — UI / Accessibility

**Status:** ✅ TARGETED IMPLEMENTATION PASS / ✅ FUNCTIONAL KEYBOARD COVERAGE GREEN / ⏳ MANUAL + VISUAL REVIEW OSTAJU

- zajednički `DialogShell` sa portalom, ARIA semantikom, focus trap/restore, Escape/backdrop politikom i body scroll lock-om;
- customer/admin mobile drawers koriste isti focus sistem;
- analytics i card-design tabs imaju roving keyboard navigation;
- reusable editor switch/range/select/segmented controls imaju eksplicitne labels/descriptions/radio/switch semantiku;
- login/topbar/color picker/brand actions su dobili targeted focus i contrast cleanup.

---

## 8. Phase 6 — Tooling / release engineering

### 6.1 Local DX

**Status:** ✅ IMPLEMENTIRANO

- `*.tsbuildinfo` je u `.gitignore`;
- dev route prewarm je opt-in preko `LINKZZZ_DEV_PREWARM=1`;
- lokalni Git auto-GC je isključen tokom ovog batch-a zbog OneDrive file-lock problema; repo dugoročno treba držati van OneDrive sync root-a.

### 6.2 Validation / deployed smoke

**Status:** ✅ IMPLEMENTIRANO

- `validate:core`: Prisma generate -> unit -> typecheck -> lint -> production build;
- `validate:full`: core + functional Playwright;
- Windows runner koristi npm JS entrypoint umesto direktnog `spawnSync("npm.cmd")`;
- `production-smoke.spec.ts` radi read-only protiv Preview/Production URL-a bez E2E DB mutacija.

### 6.3 GitHub Actions quality gate

**Status:** ✅ IMPLEMENTIRANO / ✅ CLEAN-LINUX RUN GREEN

`.github/workflows/quality-gate.yml` trajno radi na PR/push događajima za `dev` i `main`:

- **Core validation:** `npm ci` -> Prisma generate -> unit -> typecheck -> ESLint -> production build;
- **Functional E2E:** disposable PostgreSQL 17 + Chromium desktop + WebKit mobile + functional Playwright sa jednim workerom.

Prvi clean Linux run je našao dve realne rupe u tooling-u koje lokalni checkout nije mogao da pokaže:

1. `dev:e2e` je pretpostavljao da `src/generated/prisma` već postoji. E2E startup sada sam radi `prisma generate` pre migrate/seed.
2. CI je prvobitno instalirao samo Chromium, dok `mobile-390` koristi WebKit. Quality gate sada instalira oba browsera sa system dependencies.

Posle tih korekcija oba GitHub Actions job-a su green. CI ne koristi Neon/Vercel production bazu niti production secrets.

---

## 9. Validation ledger

### Lokalni core

- Prisma generate ✅
- unit tests 177/177 ✅
- TypeScript ✅
- ESLint ✅
- production build ✅

### Lokalni DB-backed functional Playwright

Prvi full run: **40 passed / 8 skipped / 6 failed**. Šest failova su bila tri uzroka duplirana na desktop/mobile:

1. unbound native `Headers.get`;
2. Page engagement ID remap;
3. custom-domain runtime parity 404.

Posle fixeva:

- targeted affected specs ✅
- custom-domain parity 2/2 ✅
- kompletan functional suite ✅
- exact-HEAD core ✅

### GitHub Actions clean Linux

- Core validation ✅
- Functional E2E sa disposable PostgreSQL 17 ✅
- Chromium desktop ✅
- WebKit mobile ✅

`pg` deprecation warning za paralelni `client.query()` ostaje odvojeni tech debt; nije uzrok trenutnih test failova.

---

## 10. Sledeći gate

1. manual desktop/mobile smoke;
2. visual diff review bez automatskog prihvatanja baseline-a;
3. proveriti stvarni Vercel branch mapping;
4. deployovati kandidata na Preview bez slanja neproverenog commita u Production;
5. pokrenuti read-only deployed production smoke nad Preview URL-om;
6. tek onda PR #57 ready/merge odluka;
7. nakon production compatibility prozora planirati zaseban Phase 3.12 contract release.

Lokalni i CI green run su sada dokazani. Sledeći rizik više nije build/test runner nego stvarno deployed ponašanje i vizuelna regresija.
