# LINKZZZ — AUDIT STATUS / ROADMAP REFRESH

**Datum:** 2026-09-05  
**Bazni integracioni commit:** `bd955a2d62efab825334dc2ca7a80e432d5e260b`  
**Radna grana:** `audit/phase3-hardening-20260905`  
**Status validacije grane:** lokalni core + DB-backed functional E2E su GREEN posle svih browser fixeva; GitHub Actions quality gate je dodat i čeka prvi runner dokaz.

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
- **Phase 6.3:** permanent GitHub PR quality gate sa odvojenim core i disposable-Postgres E2E jobovima.

Najveći preostali posao pre release candidate-a:

1. manual desktop/mobile smoke + visual diff review;
2. Vercel Preview deployed production smoke;
3. potvrditi prvi GitHub Actions quality-gate run, pa ukloniti privremeni audit-branch trigger;
4. kasniji **Phase 3.12 contract cleanup** tek posle sigurnog production compatibility prozora.

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

**Status:** 🟢 EXPAND KORAK IMPLEMENTIRAN / ✅ DB-BACKED FUNCTIONAL E2E GREEN  
**Contract cleanup:** ⏸ NAMERNO ODLOŽEN ZA KASNIJI RELEASE

### Novi first-class persistence model

`Page` dobija eksplicitna polja za media/engagement, a `PageCard` za image/availability/sensitive-content/geo runtime podatke. Gallery asset liveness dobija relacijsku tabelu:

`PageContentAssetReference(pageId, blockId, itemId, assetId, sortOrder)`

Asset ownership/liveness više ne zavisi samo od JSON scanner-a.

### Rollback-safe expand korak

1. migracija dodaje nove kolone/relacije;
2. postojeći podaci se backfill-uju;
3. legacy JSON envelope se **ne briše** u ovom release-u;
4. novi repository tokom compatibility prozora dual-write-uje legacy envelope + nova first-class polja;
5. novi reader normalizuje envelope i ne izlaže `__*` ključeve public/domain sloju.

Tek nakon stabilnog production prozora ide zaseban contract release koji prestaje sa legacy read/write i potom uklanja wrapper ključeve.

### E2E nalaz i fix

Prvi functional run otkrio je da server pravilno regeneriše ne-owned/client-supplied PageCard ID, ali Page-level `featuredLinkId` i campaign `primaryLinkId` ostaju na starom ID-u. `writePageChildren` sada vraća mapu client-id -> persisted-id, a profile repository u istoj transakciji remapuje engagement i dual-write legacy envelope pre finalnog readback-a. Targeted i full functional rerun su green.

---

## 6. Phase 4 — CSP / host routing

### 4.1 Host-aware root runtime

**Status:** ✅ IMPLEMENTIRANO / ✅ CUSTOM-DOMAIN PARITY GREEN

Prvobitni pokušaj sa `force-static` application root-om i custom-domain internal rewrite-om pokazao se krhkim u Next 16 dev/runtime putanji. Dva različita prenosa originalnog host konteksta kroz rewrite nisu pouzdano rešila parity 404.

Finalni model je jednostavniji i sigurniji:

- root `/` je host-aware server entrypoint;
- application host (`linkzzz.com`, localhost/IP u dev-u) renderuje marketing Landing Page;
- custom-domain `/` direktno razrešava ACTIVE domen i renderuje isti SmartLink runtime kao platform slug;
- custom-domain root više ne koristi internal rewrite;
- stara `__linkzzz/custom-domain` runtime ruta je uklonjena;
- application-host `/__linkzzz/*` ostaje blokiran kroz Proxy guard;
- auth/dashboard/public slug rute zadržavaju sopstveni dinamički runtime.

Tradeoff: application marketing root više nije `force-static`. To je nameran correctness-over-micro-optimization izbor dok ne postoji stabilno host routing rešenje koje ne ugrožava custom-domain parity.

### 4.2 CSP isolation

**Status:** ✅ IMPLEMENTIRANO / ✅ CORE TESTOVI GREEN

- dynamic application/public runtime koristi nonce + `strict-dynamic`;
- production marketing surface i dalje može koristiti `script-src 'none'` jer Landing Page nema obaveznu hydration funkcionalnost;
- login/navigation sa marketinga radi kao native document navigation i ponovo ulazi u nonce-protected app surface;
- development marketing zadržava lokalni Next HMR runtime;
- CSP testovi proveravaju `script-src` direktivu, a ne pogrešno ceo policy string u kome `style-src` još namerno koristi `unsafe-inline`.

---

## 7. Phase 5 — UI / Accessibility

**Status:** ✅ TARGETED IMPLEMENTATION PASS / ✅ FUNCTIONAL KEYBOARD COVERAGE GREEN / ⏳ MANUAL + VISUAL REVIEW OSTAJU

Uveden je zajednički `DialogShell` sa portalom, ARIA semantikom, focus trap/restore, Escape/backdrop politikom, body scroll lock-om i nested-dialog zaštitom.

Dodatno:

- customer/admin mobile drawers koriste isti focus sistem;
- analytics i card-design tabs imaju roving keyboard navigation;
- reusable editor switch/range/select/segmented controls imaju explicit labels/descriptions/radio/switch semantiku;
- login/topbar/color picker/brand actions su dobili targeted focus i contrast cleanup.

---

## 8. Phase 6 — Tooling / release engineering

### 6.1 Local DX

**Status:** ✅ IMPLEMENTIRANO

- `*.tsbuildinfo` je u `.gitignore`;
- dev core-route prewarm je OFF by default i uključuje se samo sa `LINKZZZ_DEV_PREWARM=1`;
- lokalni Git auto-GC je ručno isključen tokom ovog release batch-a zbog OneDrive file-lock problema; dugoročno repo treba držati van OneDrive sync root-a.

### 6.2 Validation / deployed smoke

**Status:** ✅ IMPLEMENTIRANO

- `npm run validate:core` radi Prisma generate -> unit -> typecheck -> lint -> production build;
- `npm run validate:full` dodaje functional Playwright;
- Windows runner koristi npm JS entrypoint umesto direktnog `spawnSync("npm.cmd")`;
- `e2e/production-smoke.spec.ts` radi read-only protiv Preview/Production URL-a bez E2E DB mutacija.

### 6.3 GitHub Actions quality gate

**Status:** 🟢 IMPLEMENTIRANO / 🟡 PRVI RUN PENDING

`.github/workflows/quality-gate.yml` uvodi dva odvojena job-a:

- **Core validation:** npm ci -> Prisma generate -> unit -> typecheck -> ESLint -> production build;
- **Functional E2E:** disposable PostgreSQL 17 service + Chromium + functional Playwright sa jednim workerom.

CI ne koristi Neon/Vercel production bazu niti production secrets. E2E job dobija zasebnu disposable PostgreSQL bazu. Playwright report/test-results se upload-uju samo na failure.

Workflow je trajno namenjen PR/push događajima za `dev` i `main`. Audit branch je privremeno dodat u push trigger samo radi prvog runner proof-a; taj trigger treba ukloniti posle green run-a.

---

## 9. Validation ledger

### Core gate

Lokalno potvrđeno nakon browser fixeva:

- Prisma generate ✅
- unit tests 177/177 ✅
- TypeScript ✅
- ESLint ✅
- production build ✅

### Functional Playwright

Prvi full run:

- **40 passed**
- **8 skipped**
- **6 failed**

Šest failova su bila tri ista uzroka duplirana na desktop/mobile:

1. custom-domain API 500 zbog unbound native `Headers.get`;
2. page-child engagement reference nije remapovan na novi server Card ID;
3. custom-domain runtime parity 404 kroz internal rewrite.

Posle fixeva:

- targeted logger/page-child/parity suite ✅
- final custom-domain parity **2/2 ✅**
- kompletan `test:e2e:functional -- --workers=1` ✅
- exact-HEAD `validate:core` ✅

`pg` deprecation warning za paralelni `client.query()` ostaje tech debt za odvojeni cleanup; nije uzrok test failova.

---

## 10. Sledeći gate

1. potvrditi prvi GitHub Actions quality-gate run;
2. ukloniti privremeni audit-branch CI trigger;
3. manual desktop/mobile smoke;
4. visual diff review;
5. Vercel Preview deployed production smoke;
6. tek onda PR #57 ready/merge odluka;
7. nakon production compatibility prozora planirati zaseban Phase 3.12 contract release.

Git istorija i lokalni green run nisu zamena za deployed validation. PR ostaje draft dok Preview smoke i završni manual/visual review nisu zatvoreni.
