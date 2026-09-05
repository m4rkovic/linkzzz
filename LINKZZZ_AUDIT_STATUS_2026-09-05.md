# LINKZZZ — AUDIT STATUS / ROADMAP REFRESH

**Datum:** 2026-09-05  
**Bazni integracioni commit:** `bd955a2d62efab825334dc2ca7a80e432d5e260b`  
**Radna grana:** `audit/phase3-hardening-20260905`  
**Status validacije grane:** core gate green pre poslednjih E2E fixeva; funkcionalni browser rerun je sledeći gate.

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
- **Phase 5.2:** keyboard tab semantics za analytics/card design i širi reusable form semantics pass;
- **Phase 6.1:** `*.tsbuildinfo` ignorisan i dev prewarm prebačen na opt-in;
- **Phase 6.2:** read-only production deployment smoke + one-command validation runner.

Najveći preostali posao pre release candidate-a:

1. ponoviti funkcionalni E2E nakon tri konkretna fixa iz prvog browser run-a;
2. manual desktop/mobile + visual diff review;
3. deployed Preview production smoke;
4. CI gate + formatter politika;
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

**Status:** ✅ IMPLEMENTIRANO / 🟡 BROWSER FIX RERUN PENDING

- typed `InvalidImageError` odvaja user validation od storage/infrastructure failure-a;
- unexpected asset storage/persistence/cleanup failure dobija structured log + request correlation;
- centralizovan request-session helper uklanja cookie/session copy-paste iz API ruta;
- AST contract test sprečava lokalni `catch -> 500` bez logovanja ili rethrow-a;
- expected parse/validation/auth 4xx se namerno ne tretira kao server error spam;
- prvi E2E run otkrio je da se native `Headers.get` pozivao bez objektnog binding-a, što je izazivalo `ERR_INVALID_THIS`; poziv je ispravljen i dodat je regression unit test sa pravim `Headers` objektom.

---

## 4. Phase 3.11 — Public renderer decomposition

**Status:** ✅ IMPLEMENTIRANO ARHITEKTONSKI / ⏳ ČEKA FINALNI BROWSER/DEPLOYED SMOKE

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

**Status:** 🟢 EXPAND KORAK IMPLEMENTIRAN / 🟡 FUNKCIONALNI RERUN PENDING  
**Contract cleanup:** ⏸ NAMERNO ODLOŽEN ZA KASNIJI RELEASE

### Novi first-class persistence model

`Page` dobija eksplicitna polja za media/engagement, a `PageCard` za image/availability/sensitive-content/geo runtime podatke. Gallery asset liveness dobija relacijsku tabelu:

`PageContentAssetReference(pageId, blockId, itemId, assetId, sortOrder)`

Asset ownership/liveness više ne zavisi samo od JSON scanner-a.

### Važna rollback korekcija

Uveden je expand/contract model:

1. migracija dodaje nove kolone/relacije;
2. postojeći podaci se backfill-uju;
3. legacy JSON envelope se **ne briše** u ovom release-u;
4. novi repository tokom compatibility prozora dual-write-uje legacy envelope + nova first-class polja;
5. novi reader normalizuje envelope i ne izlaže `__*` ključeve public/domain sloju.

Tek nakon stabilnog production prozora ide zaseban contract release koji prestaje sa legacy read/write i potom uklanja wrapper ključeve.

### E2E nalaz i fix

Prvi funkcionalni E2E run otkrio je da server pravilno regeneriše ne-owned/client-supplied PageCard ID, ali Page-level `featuredLinkId` i campaign `primaryLinkId` ostaju na starom ID-u. `writePageChildren` sada vraća mapu client-id -> persisted-id, a profile repository u istoj transakciji remapuje engagement i dual-write legacy envelope pre finalnog readback-a.

---

## 6. Phase 4 — CSP / rendering performance

### 4.1 Static marketing vs dynamic runtime

**Status:** 🟢 IMPLEMENTIRANO / 🟡 CUSTOM-DOMAIN RERUN PENDING

- uklonjen root `await connection()`;
- application-host `/` je eksplicitno `force-static`;
- custom-domain `/` se u Proxy sloju interno rewrite-uje na dedicated dynamic runtime route;
- interni `__linkzzz` runtime nije javno dostupan na application host-u;
- auth/dashboard/public SmartLink rute ostaju dinamičke kroz sopstvene `headers/cookies/DB` potrebe.

Prvi E2E parity run pokazao je da internal rewrite target ne sme da se oslanja na običan `Host` koji route vidi nakon rewrite-a. Proxy sada eksplicitno propagira normalizovan originalni custom hostname kroz interni request header, a dynamic runtime koristi taj host za domain resolution. Application-host direct access i dalje ostaje blokiran.

### 4.2 CSP isolation

**Status:** ✅ IMPLEMENTIRANO / CORE TESTOVI GREEN

- dynamic application/public runtime koristi nonce + `strict-dynamic`;
- production marketing `/` nema potrebu za hydration JS i dobija `script-src 'none'`;
- login/navigation sa marketinga radi kao native document navigation i ponovo ulazi u nonce-protected app surface;
- development marketing zadržava lokalni Next HMR runtime;
- CSP testovi proveravaju `script-src` direktivu, a ne pogrešno ceo policy string u kome `style-src` još namerno koristi `unsafe-inline`.

---

## 7. Phase 5 — UI / Accessibility

**Status:** ✅ TARGETED IMPLEMENTATION PASS / ⏳ MANUAL + VISUAL REVIEW OSTAJU

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
- dev core-route prewarm je OFF by default i uključuje se samo sa `LINKZZZ_DEV_PREWARM=1`.

### 6.2 Validation / deployed smoke

**Status:** ✅ IMPLEMENTIRANO

- `npm run validate:core` radi Prisma generate -> unit -> typecheck -> lint -> production build;
- `npm run validate:full` dodaje functional Playwright;
- Windows runner koristi npm JS entrypoint umesto direktnog `spawnSync("npm.cmd")`;
- `e2e/production-smoke.spec.ts` radi read-only protiv Preview/Production URL-a bez E2E DB mutacija.

---

## 9. Validation ledger

### Core gate

Na commit-u `74e98de` potvrđeno je:

- Prisma generate ✅
- unit tests 177/177 ✅
- TypeScript ✅
- ESLint ✅
- production build ✅

Poslednji E2E fix commitovi su noviji od tog core gate-a, tako da pre merge-a mora postojati još jedan finalni exact-HEAD core/full pass.

### Prvi functional Playwright run

Rezultat:

- **40 passed**
- **8 skipped**
- **6 failed**

Šest failova su tri ista uzroka na desktop/mobile projektima:

1. custom-domain API 500 zbog unbound native `Headers.get`;
2. page-child engagement reference nije remapovan na novi server Card ID;
3. custom-domain runtime parity 404 zbog gubitka originalnog custom host konteksta kroz internal rewrite.

Sva tri uzroka su implementaciono popravljena na trenutnoj grani i čekaju rerun.

`pg` deprecation warning za paralelni `client.query()` ostaje tech debt za odvojeni cleanup; nije uzrok trenutnih test failova.

---

## 10. Sledeći gate

Prvo pokrenuti samo tri pogođena E2E spec-a radi brzog feedback-a. Kada su zelena, pokrenuti kompletan functional suite sa jednim workerom. Posle toga:

1. exact-HEAD `validate:core` ili `validate:full`;
2. manual desktop/mobile smoke;
3. visual diff review;
4. Vercel Preview deployed production smoke;
5. tek onda PR ready/merge odluka.

Git je skladište istorije. Nije dokaz da kod radi. Zato PR ostaje draft dok browser/database gate stvarno ne bude zelen.
