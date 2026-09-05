# LINKZZZ — AUDIT STATUS / ROADMAP REFRESH

**Datum:** 2026-09-05  
**Bazni commit:** `bd955a2d62efab825334dc2ca7a80e432d5e260b` (`main` i `dev` su bili poravnati na ovom commit-u)  
**Radna grana:** `audit/phase3-hardening-20260905`  
**Osnova:** originalni `LINKZZZ_CODEBASE_AUDIT_REPORT(1).md` + follow-up od 2026-09-04 + direktna provera aktuelnog koda.

> Ovaj dokument je status ledger, ne novi šest-agent full audit od nule. Stavke označene kao zatvorene proverene su u aktuelnom kodu ili u integrisanom hardening batch-u. Novi branch nije masovno testiran u trenutku pisanja; poslednji integracioni commit navodi 172/172 unit testa, typecheck, lint, production build i 46 aktivnih Playwright testova kao prolazne.

---

## 1. Executive status

Aplikacija je u znatno ozbiljnijem stanju nego na originalnom auditu. Najveći rizici iz Phase 0/1 više nisu dominantni problem: tenant granice, admin mutacije, kvote, geo/shield korektnost, analytics ingest, baza i auth hardening su značajno ojačani.

Trenutni glavni dug više nije "da li sistem može da sačuva podatke bez race-a", već:

1. **public renderer arhitektura** — core javna stranica je i dalje veliki client component;
2. **CSP/dynamic rendering kompromis** — root `connection()` drži ceo tree dinamičkim zbog per-request nonce strategije;
3. **JSON domain debt** — deo Page/Card domena i dalje živi u `__` ključevima umesto u relacijama;
4. **UI/A11y sistematizacija** — prethodni contrast/dialog nalazi nisu još ponovo kompletno auditovani posle UI izmena;
5. **observability adoption** — logger postoji i radi, ali svaki lokalno uhvaćen neočekivani 5xx mora ili da se loguje ili rethrow-uje.

---

## 2. Potvrđeno zatvoreno od originalnog audita

### Runtime / tenant / concurrency

- **RT-005** — Prisma client/pool problem zatvoren.
- **RT-002** — custom-domain host/path gating postoji u `src/proxy.ts` i `host-routing` sloju.
- **RT-003** — SmartLink geo više nije zaobilazan preko outbound resolvera.
- **RACE-001** — SmartLink kvote su zaštićene server-side i concurrency putanja je testirana.
- **INT-001 / RACE-005** — admin account/subscription mutacije koriste transakcije + per-user lock.
- **INT-105** — jedan loš customer zapis više ne ruši ceo admin read path; last landing-page invariant je zaštićen.

### API / validation

- **API-002** — profile validator više ne vraća originalni attacker-controlled objekat. `profile-validation.ts` završava kroz `parseValidatedProfilePayload`, a parser eksplicitno pick-uje dozvoljena polja, uključujući nested objekte.
- **API-003/004** — analytics ingest ima rate limit pre obrade i byte-limited JSON reader.
- **API-005 / OBS-002** — admin/custom-domain rute imaju typed known errors i safe generic 500 za neočekivane greške.

### Analytics / performance / DB

- **AN-001 / PERF-001/002** — analytics dashboard više ne učitava lifetime event stream u Node radi glavne agregacije. `PrismaAnalyticsRepository.getDashboardData()` koristi `queryAnalyticsPeriodSummaries()` i summary builder.
- **SUB-002 ostatak** — analytics repository koristi centralni `getSubscriptionAccess`.
- **DB-001** — dodati su relevantni kompozitni analytics indeksi.
- **INT-102** — baza ima `CustomDomain_active_requires_verification` CHECK.
- **PERF-003** — PageCard/Social/Stat update više nije per-row upsert petlja; postoje batch update-i preko `jsonb_to_recordset` + `createMany`.

### Custom domains

- **DOM-001** — re-verification ACTIVE domena više ga ne demotuje.
- **DOM-002/003** — uvedeni su PENDING claim TTL, reclaim flow i verification freshness.
- ACTIVE routing zahteva svežu verifikaciju; istekla verifikacija prestaje da bude routable.
- postoji admin release flow i audit akcije za reclaim/release.

### Assets

- **AST-002** — postoji orphan sweeper i admin endpoint za sweep.
- uvedena je per-customer storage kvota (`ASSET_STORAGE_QUOTA_BYTES`).
- production storage adapter je hardenovan u odnosu na raniji audit.

### Auth

- **AUTH-005** — unknown-account login koristi realan dummy scrypt hash radi timing izjednačavanja.
- **AUTH-001** — novi hash policy je podignut na scrypt `N=32768, r=8, p=3`, uz `needsRehash` za stare hash-eve.

### Traffic Shield

- `STANDARD` i `STRICT` više nisu mrtvo-dupli modovi: UNKNOWN UA je PREVIEW u STANDARD, BLOCK u STRICT.
- poznati social/search crawleri i dalje dobijaju preview umesto distribucionog 404-a.

---

## 3. OBS-001 — korigovan status

### Završeno

- strukturirani JSON logger (`server-logger.ts`);
- `info/warn/error` nivoi;
- redaction credential/token/cookie/session polja;
- request correlation ID (`x-request-id` / `x-vercel-id`);
- Next `instrumentation.ts` `onRequestError` hook za uncaught request greške.

### Preostali problem

Nije korektno zahtevati `logServerError` u svakom `catch` bloku. Parse/validation/authorization catch-evi su očekivani 4xx i ne treba da zatrpavaju error log.

Pravi invariant treba da bude:

> **Svaki neočekivani exception koji route lokalno pretvara u 5xx mora biti logovan sa kontekstom ili ponovo bačen tako da ga `onRequestError` vidi.**

Na baznom commit-u konkretan gap je `POST /api/assets/images`: storage/persistence failure mogao je biti pretvoren u response bez punog observability traga; cleanup preko `Promise.allSettled` je takođe mogao tiho da proguta neuspešno brisanje objekta.

**Status:** 🟡 infrastruktura završena, adoption se dovršava u ovoj grani.

---

## 4. Otvorene velike stavke

### ARCH-001 / NEXT-001 — public renderer je i dalje client-heavy

`src/components/public/public-profile.tsx` i dalje počinje sa `"use client"` i hidrira kompletan profile renderer. Pozitivno: React `ElementType` više nije deo osnovnog profile domain tipa, pa je najgora serialization prepreka uklonjena. Sledeći korak je server-rendered shell + mali client islands za share, countdown, sensitive-content gate i tracking.

**Prioritet:** HIGH zbog javne money-page putanje i bundle/hydration troška.

### NEXT-002 — root `connection()` i CSP nonce

`src/app/layout.tsx` i dalje zove `await connection()`, pa ceo route tree ostaje request-dynamic.

Bitna korekcija starog roadmap-a: ovo nije bezbedan "obriši jednu liniju" fix. `src/proxy.ts` generiše per-request CSP nonce i prosleđuje CSP request header Next-u. Next-ov nonce model i statički HTML nisu nešto što treba naslepo razdvojiti. Potrebna je svesna odluka:

- zadržati nonce i prihvatiti dynamic shell; ili
- preći na CSP strategiju kompatibilnu sa statičkim/ISR output-om, pa tek onda ukloniti `connection()`.

**Prioritet:** HIGH, ali tek uz CSP regression testove.

### ARCH-007 / AST-003 — JSON domain debt

`page-children-writer.ts` i dalje skladišti domenske podatke kroz `__imageUrl`, `__availability`, `__sensitiveContent`, `__geo`, `__engagement` i slične JSON ključeve. To je funkcionalno, ali slabo za FK/index/query/invariant nivo.

Gallery asset reference lifecycle je ojačan sweeperom/kvotom, ali pravi završetak je normalizovana tabela za gallery/media i uklanjanje literal-key JSON walker zavisnosti.

**Prioritet:** MEDIUM-HIGH.

### UI / A11y

Originalni audit je imao sistemske contrast i modal-focus nalaze. Od tada je UI dosta menjan, zato stare brojke ne treba nekritički prepisivati kao aktuelne. Potreban je novi ciljano pokrenut UI/A11y pass nakon arhitektonskog hardening-a.

**Prioritet:** MEDIUM-HIGH pre javnog launch-a.

### Tooling

- Prettier i dalje nije deo toolchain-a.
- E2E server i dalje pokreće dev server (`scripts/start-e2e-server.ts` → `scripts/dev-server.mjs`), ne production `next start` artifact.

**Prioritet:** MEDIUM.

---

## 5. Novi nalazi / korekcije prethodnih nalaza

### NEW-OBS-001 — asset storage error classification

Image signature validation i S3/local infrastructure failure su ranije oba izlazili kroz običan `Error`. Route je zbog toga mogao da vrati storage outage kao 400 i čak prosledi `error.message` browseru.

**Fix u ovoj grani:** typed `InvalidImageError` ostaje 400; neočekivani storage failure postaje safe 500 + structured log.

### NEW-OBS-002 — cleanup failure je bio nevidljiv

Asset cleanup je koristio `Promise.allSettled` bez pregleda rejected rezultata. DB zapis može biti uklonjen, a object-storage delete da propadne bez traga.

**Fix u ovoj grani:** svaki rejected storage delete dobija structured error event sa request/user/SmartLink/asset kontekstom.

### NEW-NEXT-001 — NEXT-002 mora da se tretira zajedno sa CSP dizajnom

Stari audit je `connection()` tretirao kao isolated performance smell. Aktuelni kod eksplicitno generiše per-request CSP nonce u proxy sloju. Performance fix koji ignoriše ovu vezu može napraviti security/runtime regresiju.

---

## 6. Roadmap od ovog trenutka

### Phase 3.10 — Observability completion — IN PROGRESS

1. Typed asset validation error.
2. Log unexpected storage/persistence failures.
3. Log storage cleanup failures umesto tihog `allSettled` gutanja.
4. Dodati request correlation ID u custom-domain local error path.
5. Kasnije dodati static/contract guard da caught 5xx ne može da ostane bez log/rethrow obrasca.

### Phase 3.11 — Public renderer decomposition

1. Zadržati serializable persisted profile model.
2. Prebaciti statične delove renderera na server components.
3. Client islands samo za stvarnu interakciju.
4. Merenje bundle-a i hydration-a pre/posle.

### Phase 3.12 — Persistence model cleanup

1. Gallery/media relacije umesto JSON walker-a.
2. Postepeno ukloniti `__*` domenske ključeve.
3. Migracija sa backfill-om, pa dual-read kratko, pa uklanjanje legacy mirror-a.

### Phase 4 — Rendering/performance

1. Doneti eksplicitnu CSP nonce vs static/ISR odluku.
2. Tek zatim rešiti root `connection()`.
3. Profilisati public request query count i JS payload nakon server-renderer rada.

### Phase 6 — UI/A11y pass

1. Contrast audit nad aktuelnim UI-jem.
2. Jedan reusable Dialog shell sa focus trap/restore/escape semantics.
3. Responsive + keyboard + screen-reader regression suite.

### Final mass validation

Kada se gore navedeni batch-evi spoje: `npm test` → `npm run typecheck` → `npm run lint` → production build → functional E2E → visual E2E. Do tada branch-evi se tretiraju kao implementation work, ne kao release candidate.
