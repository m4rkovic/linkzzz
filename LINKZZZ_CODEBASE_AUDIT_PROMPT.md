# LINKZZZ — FULL CODEBASE AUDIT PROMPT

## Context: What is Linkzzz?

You are auditing **Linkzzz**, a production-oriented SaaS application built with:

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **PostgreSQL**
- **Prisma ORM**

Linkzzz is not a generic "link in bio" demo. It is a multi-feature link management and traffic-routing platform where users can create shareable links, landing pages, deep links, geo-based routing rules, tracking configurations, custom domains, analytics, and traffic protection rules.

The system also contains an admin-managed subscription model.

The purpose of this audit is to determine whether the current implementation is:

- correct,
- secure,
- maintainable,
- scalable enough for the intended product,
- internally consistent,
- properly tested,
- production-ready.

Do **not** modify any files during this audit.

The first task is analysis only.

---

# 1. CURRENT PRODUCT MODEL

Before reviewing the code, understand the intended product model.

## 1.1 User provisioning

Linkzzz currently uses an **admin-provisioned account model**.

There is intentionally:

- no public signup,
- no social login,
- no self-service checkout,
- no payment gateway.

Admins are responsible for:

- creating users,
- assigning plans,
- changing plans,
- renewing subscriptions,
- suspending/reactivating users,
- stopping renewal,
- stopping access immediately,
- disabling profiles,
- resetting passwords.

Subscription changes must **never silently delete user data**.

Stopping, expiring, suspending, downgrading, or changing a subscription must not automatically delete:

- users,
- SmartLinks,
- landing pages,
- cards,
- assets,
- custom domains,
- analytics,
- profile data,
- tracking configuration,
- geo rules,
- deep link settings.

Explicit deletion must be separate from subscription state changes.

Audit this invariant very carefully.

---

# 2. CURRENT PLAN MODEL

The current plan tiers are:

| Plan | Price | SmartLinks | Links/Cards per Landing Page |
|---|---:|---:|---:|
| BASIC | $40/month | 50 | 10 |
| PRO | $80/month | 100 | 30 |
| ENTERPRISE | $150/month | 200+ | 100 |

Important:

The old `PREMIUM` / `PREMIUM_PLUS` model is obsolete.

Search the repository for stale references to:

- PREMIUM
- PREMIUM_PLUS
- old link limits
- old plan names
- old pricing
- old subscription enums
- obsolete test expectations

Current plan differences are primarily **quantity limits**.

Do not assume that features such as these are plan-gated unless the code/product specification explicitly says so:

- Analytics
- Geo routing
- Deeplink
- Traffic Shield
- Custom Domains
- GA4
- Meta tracking
- other advanced features

Audit for accidental or stale feature-gating.

---

# 3. TERMINOLOGY

The product uses the concept **SmartLink**.

Be especially careful with inconsistent terminology such as:

- Link
- SmartLink
- Page
- Landing Page
- Direct Link

A shareable URL is represented by a unique Link/SmartLink entity.

Current link types include:

- `LANDING_PAGE`
- `DIRECT`

The UI may use shorter labels where appropriate, but internal naming must not become inconsistent enough to confuse the domain model.

Search for stale or accidental terminology changes.

Flag cases where:

- the database calls something one thing,
- services call it another,
- UI calls it another,
- tests assume a fourth meaning.

---

# 4. SMARTLINK OWNERSHIP MODEL

The application is designed around **SmartLink-scoped ownership**.

Relevant child data may include:

- landing page configuration,
- cards,
- assets,
- custom domain,
- analytics,
- deeplink configuration,
- geo rules,
- tracking settings,
- Traffic Shield settings.

Audit ownership boundaries very carefully.

Check for:

- access to another user's SmartLink,
- access to another SmartLink's asset,
- cross-link analytics leakage,
- domain ownership confusion,
- editing child resources without validating parent ownership,
- API routes that trust IDs supplied by the browser,
- authorization checks performed only in the frontend.

A user being authenticated is **not enough**.

Every protected operation must validate ownership and permission server-side.

---

# 5. SMARTLINK EDITOR MODEL

The intended editor flow is conceptually:

`Link → Page → Deeplink → Geo → Tracking / Advanced`

Audit whether the code reflects a coherent domain flow.

Look for:

- duplicated state across editor tabs,
- one tab overwriting data owned by another,
- unsaved state being silently lost,
- partial updates that reset unrelated fields,
- forms sending entire objects where PATCH semantics would be safer,
- editor state diverging from database state,
- race conditions between autosave/manual save operations,
- duplicated validation logic.

Check whether the editor architecture can safely evolve as more SmartLink functionality is added.

---

# 6. LANDING PAGE MODEL

Landing pages may contain multiple links/cards.

The number of links/cards is constrained by the user's plan.

Audit:

- server-side enforcement,
- UI enforcement,
- database-level assumptions,
- E2E tests,
- unit tests,
- admin behavior,
- plan upgrades,
- plan downgrades.

A crucial rule:

**The backend must be the authority for quota enforcement.**

The UI may display limits, but hiding or disabling a button is not enforcement.

Check what happens when:

- BASIC user already has 10 cards,
- PRO user already has 30 cards,
- ENTERPRISE user reaches its configured limit,
- a user is downgraded below their current usage.

Do not assume that downgrade should delete existing cards.

Determine actual behavior from the code and identify inconsistencies.

---

# 7. SINGLE SOURCE OF TRUTH — CRITICAL AUDIT AREA

This project has changed plan tiers and limits during development.

Therefore, aggressively search for duplicated business constants.

Examples:

- `"1 / 30"`
- `"1 / 100"`
- `30`
- `50`
- `100`
- `200`
- plan prices
- plan names
- feature labels
- subscription states
- role names
- retry limits
- analytics event names
- domain status names

Find cases where the same business rule is hardcoded independently in:

- React components,
- services,
- repositories,
- route handlers,
- Prisma schema,
- seed files,
- migrations,
- Playwright tests,
- unit tests,
- admin UI,
- user dashboard,
- constants/config files.

For every duplicated business rule determine:

1. Is duplication intentional?
2. Should there be one canonical source?
3. Is the test supposed to use the same source?
4. Would using the production constant make the test weaker?

Do **not** blindly force tests to import implementation constants.

Example:

A UI rendering test may reasonably use the central plan catalog.

A domain behavior test may intentionally use an explicit expected value so that it detects an incorrect catalog.

Distinguish those cases.

---

# 8. SMARTLINK RUNTIME / REDIRECT PIPELINE

The SmartLink runtime is one of the most important parts of Linkzzz.

Conceptually, traffic may pass through logic such as:

`Traffic Shield → Geo → Destination → Device/Browser → Deeplink/Helper/HTTPS Fallback → Analytics`

Audit the actual implementation and determine whether this ordering is correct and consistent.

Supported redirect/deeplink strategies may include:

- `SMART`
- `STANDARD_REDIRECT`
- `EXTERNAL_BROWSER_HELPER`

Geo actions may include:

- `REDIRECT`
- `BLOCK`
- `DEFAULT_PAGE`

Traffic Shield modes may include:

- `STANDARD`
- `STRICT`

Audit:

- redirect loops,
- malformed destination URLs,
- open redirects,
- unsafe URL schemes,
- duplicate analytics events,
- analytics firing before/after blocked traffic incorrectly,
- bot traffic entering audience metrics,
- device/browser detection,
- fallback behavior,
- failure behavior,
- latency caused by sequential processing.

Check whether business decisions are performed server-side where appropriate.

---

# 9. DEEPLINK SYSTEM

Linkzzz supports deeplinking.

The system may support:

- predefined destinations,
- custom destinations,
- app-specific routes,
- helper pages,
- HTTPS fallback,
- device/browser-based behavior.

Audit:

- URL validation,
- URL normalization,
- custom schemes,
- dangerous schemes,
- malformed input,
- encoded URLs,
- fallback correctness,
- duplicate normalization in client and server,
- handling of unsupported devices,
- embedded browser behavior,
- social app webviews.

Validation and normalization must ultimately be server-side.

The browser cannot be trusted as the only validator.

---

# 10. GEO ROUTING

Audit the Geo functionality in depth.

Check:

- country matching,
- default behavior,
- no-match behavior,
- rule priority,
- multiple matching rules,
- blocked regions,
- redirects,
- default page behavior,
- invalid country codes,
- missing geolocation data,
- VPN/proxy implications where relevant,
- request metadata assumptions,
- Vercel/proxy/header trust.

Search for geo logic implemented independently in multiple places.

Ensure preview/editor behavior cannot be mistaken for authoritative runtime logic.

---

# 11. TRAFFIC SHIELD / BOT HANDLING

Linkzzz contains server-side traffic filtering / Traffic Shield behavior.

Audit:

- crawler detection,
- bot detection,
- preview crawlers,
- known social crawlers,
- crawler decision logic,
- false positives,
- fallback behavior,
- analytics filtering,
- server/client split.

Bot or crawler decisions that affect redirects or analytics should not depend solely on client-side JavaScript.

Check whether Shield behavior is deterministic and testable.

Search for duplicated lists of:

- user agents,
- bot names,
- crawler names,
- bypass rules.

Also inspect whether any anti-bot implementation accidentally blocks legitimate users or required preview traffic.

---

# 12. CUSTOM DOMAINS

Custom domains are associated with a specific SmartLink.

Relevant statuses may include:

- `PENDING`
- `VERIFIED`
- `ACTIVE`
- `DISABLED`

Audit the complete lifecycle:

1. creation,
2. DNS configuration,
3. verification,
4. activation,
5. resolution,
6. disabling,
7. deletion.

Check for:

- duplicate domains,
- case sensitivity,
- normalization,
- trailing dots,
- `www` differences,
- IDN/punycode issues,
- one domain mapped to multiple SmartLinks,
- ownership checks,
- stale verified status,
- insecure trust of Host headers,
- platform hostname vs custom hostname behavior.

The custom-domain request path should use the same canonical SmartLink resolution logic wherever practical.

Do not allow two separate runtime implementations to slowly diverge.

---

# 13. ANALYTICS

Linkzzz has internal server-side analytics.

Events may include:

- page view,
- card click,
- social click,
- deeplink attempt,
- deeplink fallback,
- Traffic Shield block.

Bot traffic should not inflate normal audience KPIs.

Audit:

- duplicate event recording,
- missing events,
- event naming consistency,
- bot exclusion,
- blocked traffic,
- unique visitor logic,
- session logic,
- timezone handling,
- date bucketing,
- aggregation,
- query performance,
- indexes,
- retention assumptions,
- privacy-sensitive stored data,
- IP handling,
- user-agent storage,
- referer handling.

Check whether analytics writes can slow down redirects.

If analytics is synchronous in the redirect critical path, determine whether this is justified.

---

# 14. TRACKING / THIRD-PARTY INTEGRATIONS

If GA4, Meta Pixel or similar tracking exists, audit:

- user-supplied IDs,
- validation,
- script injection risk,
- escaping,
- duplicate script loading,
- SSR/client boundary,
- consent assumptions,
- failure isolation.

No user-controlled tracking value should become arbitrary executable JavaScript.

---

# 15. ASSET MANAGEMENT

Audit uploaded/managed assets.

Check:

- ownership,
- filename handling,
- MIME validation,
- file type validation,
- size limits,
- extension spoofing,
- storage paths,
- deletion,
- orphaned assets,
- references from SmartLinks,
- replacing assets,
- cache behavior,
- image optimization.

Deleting a SmartLink or page must have explicit, understandable asset lifecycle behavior.

Do not assume cascade deletion is automatically correct.

---

# 16. SUBSCRIPTIONS

Audit the full subscription state machine.

Search for:

- active,
- expired,
- suspended,
- cancelled,
- stop renewal,
- stop instantly,
- renewal,
- admin changes,
- plan changes.

Determine the actual canonical states from the code.

Then verify that behavior is consistent across:

- database,
- domain logic,
- admin UI,
- user UI,
- middleware,
- API,
- tests.

Pay special attention to time boundaries.

Check:

- timezone,
- inclusive/exclusive expiration timestamps,
- midnight edge cases,
- renewal timing,
- suspended users,
- expired sessions,
- stale cached plan data.

Stopping renewal should not accidentally behave like immediate termination.

Immediate termination should not accidentally delete data.

---

# 17. ADMIN PANEL

The admin panel is security-sensitive.

Audit every admin action.

Check:

- role verification server-side,
- privilege escalation,
- admin-only APIs,
- user creation,
- password reset,
- plan assignment,
- subscription updates,
- suspension,
- profile disabling,
- destructive actions.

Never accept frontend UI visibility as authorization.

Search for APIs where an ordinary authenticated user could manually send the same HTTP request as the admin UI.

---

# 18. AUTHENTICATION / SESSION SECURITY

Audit:

- password storage,
- password hashing,
- session generation,
- session storage,
- cookie flags,
- Secure,
- HttpOnly,
- SameSite,
- expiration,
- logout,
- invalidation,
- password reset,
- admin reset behavior,
- session rotation.

Check whether:

- suspended users keep valid sessions,
- password changes invalidate old sessions,
- disabled users can continue using an old cookie,
- admin actions immediately affect authorization when they should.

---

# 19. DATABASE / PRISMA

Prisma + PostgreSQL is the canonical persistence layer.

Audit:

- `schema.prisma`
- all migrations
- seeds
- relations
- foreign keys
- unique constraints
- indexes
- cascade rules
- nullable fields
- defaults
- enums

Search for historical schema leftovers.

The product has undergone substantial plan/domain changes, so migration history matters.

Look for:

- obsolete columns,
- obsolete enums,
- migrations that preserve stale concepts,
- seed values inconsistent with current catalog,
- indexes missing from analytics/runtime queries.

Check transaction boundaries for multi-step operations.

Examples:

- creating SmartLink + page,
- subscription changes,
- deleting complex resources,
- custom domain assignment,
- analytics-related updates.

---

# 20. REPOSITORY / SERVICE ARCHITECTURE

Inspect repository and service structure.

A known architectural risk in projects like this is a large `repositories.ts` or similar file containing many unrelated repository classes.

Do not judge only by line count.

Judge by responsibilities.

Look for repository classes covering unrelated domains such as:

- User
- PasswordCredential
- Session
- Subscription
- SmartLink
- Profile
- Audit
- SubscriptionHistory
- Analytics
- LeadSubmission
- Asset
- CustomDomain

If multiple independent repositories are grouped into one very large file, determine whether splitting them improves:

- ownership,
- navigation,
- testability,
- dependency management,
- merge conflict risk.

Also detect the opposite problem: hundreds of microscopic files with no meaningful abstraction benefit.

---

# 21. NEXT.JS APP ROUTER

Audit:

- route groups,
- layouts,
- pages,
- route handlers,
- middleware,
- loading boundaries,
- error boundaries,
- not-found behavior,
- metadata,
- dynamic routes.

Audit every `"use client"`.

Determine whether it is actually required.

Look for client boundaries that accidentally turn large parts of the application into client-side React.

Inspect:

- server/client data fetching,
- hydration,
- serialization,
- cookies,
- headers,
- request context,
- dynamic rendering.

Flag unnecessary client fetching when the server already has the required data.

---

# 22. REACT

Audit for:

- oversized components,
- prop drilling,
- unclear state ownership,
- duplicated state,
- derived state stored unnecessarily,
- stale closures,
- bad `useEffect` dependencies,
- effect-based synchronization,
- infinite loops,
- race conditions,
- unmounted updates,
- unnecessary renders,
- unstable keys,
- modal state bugs,
- form state reset bugs.

Do not recommend `useMemo` or `useCallback` as decoration.

Only recommend them when there is a measurable or architectural reason.

---

# 23. TYPESCRIPT

Search for:

- `any`
- `unknown` misuse
- unsafe casts
- `as unknown as`
- `!`
- over-optional models
- duplicate DTOs
- frontend/backend drift
- incorrect enums
- stringly typed domain logic.

Determine whether TypeScript actually models the domain.

Important Linkzzz concepts should ideally be difficult to represent incorrectly.

Examples:

- plan tier,
- subscription state,
- SmartLink type,
- custom domain status,
- geo action,
- deeplink strategy,
- Shield mode,
- analytics event type.

---

# 24. API VALIDATION

Inspect every mutation endpoint.

For each one ask:

1. Is the user authenticated?
2. Is authorization verified?
3. Is resource ownership verified?
4. Is input schema validated?
5. Are unknown properties rejected or ignored safely?
6. Are URLs normalized?
7. Are plan limits enforced?
8. Is the operation atomic where necessary?
9. Does error output leak implementation details?

Search for trust in TypeScript types coming from HTTP requests.

TypeScript does not validate runtime input.

---

# 25. SECURITY AUDIT

Perform a serious security review.

Inspect for:

- broken access control,
- IDOR,
- XSS,
- stored XSS,
- reflected XSS,
- CSRF,
- SQL injection,
- unsafe raw Prisma queries,
- command injection,
- SSRF,
- open redirect,
- path traversal,
- unsafe file upload,
- secret leakage,
- environment variable leakage,
- privilege escalation,
- session fixation,
- insecure cookies,
- user enumeration,
- brute-force exposure,
- missing rate limits.

For Linkzzz, **open redirects and user-controlled redirect destinations require special attention** because redirecting users is a core product feature.

Do not label every intentional external redirect an "open redirect".

Distinguish between:

- intended user-configured destination behavior,
- unauthorized manipulation of another user's destination,
- platform/system redirects that accept arbitrary untrusted targets.

---

# 26. ENVIRONMENT / DEPLOYMENT

Audit:

- `.env`
- `.env.example`
- env parsing,
- env validation,
- Vercel assumptions,
- local/dev/test/prod differences,
- database URLs,
- public env variables,
- secret env variables,
- hostname configuration,
- custom domain handling.

Search for:

- hardcoded localhost,
- local filesystem assumptions,
- Windows-only behavior,
- development-only fallback accidentally available in production.

---

# 27. PERFORMANCE

Do not perform cargo-cult optimization.

Find concrete problems.

Inspect:

- slow Next.js rendering,
- development runtime regressions,
- excessive server recompilation,
- large client bundle,
- unnecessary `"use client"`,
- heavy package imports,
- repeated DB queries,
- N+1 queries,
- serial awaits,
- duplicate fetches,
- waterfall requests,
- analytics writes in redirect path,
- repeated session lookups,
- repeated plan/catalog lookups,
- expensive dashboard aggregates.

Recent development work has included test/E2E infrastructure and refactors.

Specifically investigate whether test/dev tooling can affect normal local development performance.

Examples:

- custom E2E server wrappers,
- altered Next startup commands,
- environment switches,
- instrumentation,
- disabled caching,
- test DB initialization,
- middleware changes.

---

# 28. E2E / PLAYWRIGHT

Audit Playwright configuration and tests in depth.

Check:

- `webServer`,
- custom E2E server scripts,
- CJS/ESM compatibility,
- TypeScript execution,
- startup reliability,
- ports,
- test database lifecycle,
- workers,
- retries,
- baseURL,
- environment variables.

Search for:

- hardcoded plan values,
- fragile text assertions,
- `waitForTimeout`,
- random sleeps,
- selectors based on styling,
- test ordering,
- reused dirty database,
- tests creating conflicting users,
- shared global state,
- retry masking bugs.

Ensure test setup cannot modify the normal dev environment.

---

# 29. TEST STRATEGY

Classify current tests into:

- unit,
- domain,
- repository,
- integration,
- route/API,
- UI/component,
- E2E.

Then identify important missing coverage.

At minimum assess coverage for:

### Plans
- BASIC limits
- PRO limits
- ENTERPRISE limits
- upgrades
- downgrades

### Subscriptions
- renewal
- expiration
- stop renewal
- stop immediately
- suspension/reactivation
- data preservation

### SmartLinks
- creation
- editing
- deletion
- ownership

### Landing pages
- card limits
- order
- validation

### Deeplink
- supported strategies
- fallback
- malformed destinations

### Geo
- redirect
- block
- default
- no match

### Shield
- human
- crawler
- block behavior
- analytics exclusion

### Custom domains
- pending
- verified
- active
- disabled
- ownership
- duplicate hostname

### Analytics
- page view
- card click
- deeplink
- blocked traffic
- bot exclusion

### Admin
- normal user denied
- admin allowed

---

# 30. UI / DESIGN SYSTEM

Linkzzz should have a coherent visual identity.

Audit:

- duplicated button/input/card/modal implementations,
- inconsistent colors,
- dashboard vs landing page visual drift,
- dark/light assumptions if applicable,
- typography,
- spacing,
- border radius,
- shadows,
- hover/focus states,
- loading states,
- empty states,
- error states,
- destructive actions.

The visual language should be reusable rather than individually hardcoded per page.

Do not propose a rewrite purely for aesthetics.

---

# 31. RESPONSIVE DESIGN

The application is expected to be fully responsive/mobile-first.

Audit all major areas:

- public landing page,
- login,
- user dashboard,
- SmartLink list,
- editor,
- analytics,
- settings,
- admin dashboard,
- tables,
- dialogs,
- navigation,
- sidebars.

Find:

- fixed widths,
- viewport overflow,
- broken grids,
- huge modals,
- non-scrollable tables,
- desktop-only navigation,
- tiny touch targets,
- long URLs breaking layouts.

---

# 32. ACCESSIBILITY

Perform a practical accessibility audit.

Check:

- semantic HTML,
- headings,
- labels,
- buttons,
- keyboard navigation,
- focus management,
- dialogs,
- aria attributes,
- alt text,
- error announcements,
- contrast.

Prioritize real user-impacting findings.

---

# 33. DEAD CODE / LEGACY CODE

Because Linkzzz has changed significantly during development, aggressively search for leftovers.

Examples:

- old plan tiers,
- old route names,
- obsolete components,
- old SmartLink terminology,
- old seed values,
- abandoned API implementations,
- old persistence layers,
- duplicate repositories,
- unused migration helpers,
- commented code,
- stale feature flags.

Do not delete anything.

Report confidence that each candidate is truly unused.

---

# 34. DEPENDENCIES

Review `package.json` and lockfile.

Find:

- unused dependencies,
- overlapping libraries,
- packages imported only once for trivial logic,
- packages in dependencies that belong in devDependencies,
- build/test packages accidentally used at runtime,
- known incompatible combinations.

Do not recommend upgrading everything simply because a newer version exists.

---

# 35. ERROR HANDLING / OBSERVABILITY

Audit:

- route errors,
- service errors,
- repository errors,
- UI errors,
- logging,
- audit logging,
- stack leakage,
- silent catches,
- `console.log`,
- `console.error`.

Determine whether production failures would be diagnosable.

Important actions should be traceable where appropriate, especially admin changes.

---

# 36. DATA INTEGRITY

Search specifically for ways the app can enter an impossible state.

Examples:

- SmartLink without required owner,
- page belonging to wrong SmartLink,
- custom domain linked to conflicting SmartLinks,
- active domain that is not verified,
- subscription pointing to obsolete tier,
- analytics event referencing deleted resources,
- child asset owned by a different user,
- limits below current usage causing destructive behavior.

For each invariant determine whether it is enforced by:

- database,
- domain/service,
- API,
- UI only.

Prefer important invariants to have enforcement below the UI layer.

---

# 37. CONCURRENCY / RACE CONDITIONS

Audit:

- double-submit,
- duplicate SmartLink slug creation,
- duplicate domain creation,
- plan quota race conditions,
- concurrent card creation,
- simultaneous admin subscription changes,
- analytics increments,
- asset replacement.

Example:

If a PRO user has 29/30 cards and two requests create a card simultaneously, can both pass a pre-check and produce 31/30?

Identify these cases.

---

# 38. PRODUCTION READINESS

Evaluate:

- build reproducibility,
- migration process,
- seed safety,
- deployment,
- rollback ability,
- environment validation,
- database safety,
- runtime logging,
- error handling,
- health/readiness,
- custom domains,
- HTTPS assumptions,
- rate limiting,
- security headers,
- backups where architecture exposes relevant configuration.

Do not invent infrastructure that is outside the repository.

Clearly distinguish:

- verified from code,
- inferred,
- unknown.

---

# 39. HOW TO REPORT FINDINGS

Do **not** give generic advice.

Every finding must contain:

### ID
Example: `SEC-001`, `ARCH-004`, `TEST-007`

### Severity
- CRITICAL
- HIGH
- MEDIUM
- LOW
- INFO

### Confidence
- CERTAIN
- LIKELY
- POSSIBLE

### File(s)
Exact path.

### Evidence
Relevant code behavior, symbol, line/range where possible.

### Problem
What is wrong.

### Impact
What can realistically happen.

### Recommended fix
Concrete proposed approach.

### Scope
Choose:

- Quick fix
- Local refactor
- Multi-file refactor
- Architecture change
- Migration
- Breaking change

Do not inflate severity.

A large file is not automatically HIGH severity.

A naming issue is not a security vulnerability.

---

# 40. REQUIRED FINAL REPORT

Produce the final analysis in this exact high-level structure.

## A. Executive Summary

Maximum 20 findings.

Summarize the actual state of Linkzzz.

---

## B. System Map

Explain the discovered architecture:

`Request → Next.js → Auth → Domain/Service → Repository → Prisma → PostgreSQL`

and for runtime links:

`Visitor → SmartLink Resolver → Shield → Geo → Destination/Deeplink → Analytics`

Adjust the diagram to match the actual code.

Do not force this model if the implementation differs.

---

## C. Critical / High Findings

| ID | Severity | Confidence | Area | File | Problem | Impact |
|---|---|---|---|---|---|---|

---

## D. Business Logic / Single Source of Truth

Pay particular attention to plan/catalog drift.

---

## E. Security

---

## F. Authentication / Authorization / Admin

---

## G. SmartLink Runtime

---

## H. Deeplink / Geo / Traffic Shield

---

## I. Custom Domains

---

## J. Subscription / Plans

---

## K. Database / Prisma / Migrations

---

## L. Analytics

---

## M. Backend / API

---

## N. Next.js / React / TypeScript

---

## O. Performance

---

## P. Testing / Playwright

---

## Q. UI / Responsive / Accessibility

---

## R. Dead Code / Duplication / Legacy

---

## S. Top 20 Files Requiring Attention

For each file include:

- path,
- approximate LOC if available,
- responsibility,
- problem,
- severity,
- proposed action.

---

## T. Missing Tests

Create a prioritized list.

---

## U. Refactor Roadmap

### Phase 0 — Emergency
Security, data corruption, broken authorization, severe production bugs.

### Phase 1 — Correctness
Business logic and broken behavior.

### Phase 2 — Domain consistency
Plan catalog, terminology, state machines, ownership.

### Phase 3 — Architecture
Repositories, services, component boundaries.

### Phase 4 — Performance
Only verified or strongly justified optimizations.

### Phase 5 — Test stabilization
Unit/integration/E2E improvements.

### Phase 6 — UI / responsive / accessibility

### Phase 7 — Cleanup
Dead code, naming, low-risk simplification.

For every step specify dependencies.

---

# 41. PROJECT SCORE

Score Linkzzz from 1–10 for:

| Category | Score | Reason |
|---|---:|---|
| Architecture | | |
| Business logic consistency | | |
| Code quality | | |
| Type safety | | |
| Security | | |
| Authentication / Authorization | | |
| Data integrity | | |
| Performance | | |
| Test quality | | |
| UI architecture | | |
| Responsive design | | |
| Maintainability | | |
| Production readiness | | |

Use evidence from the repository.

---

# 42. FINAL RULES

1. **Do not modify code.**
2. Analyze the whole repository before giving global conclusions.
3. Search for references before declaring code unused.
4. Do not invent bugs.
5. Do not invent enterprise abstractions.
6. Do not recommend microservices.
7. Do not recommend rewriting the project unless there is overwhelming evidence.
8. Prefer incremental fixes.
9. Prioritize correctness over style.
10. Prioritize security and data integrity over refactoring.
11. Treat frontend validation as UX, not security.
12. Treat backend/domain rules as authoritative.
13. Check migration history before concluding the schema is wrong.
14. Check tests before changing business rules.
15. Check the current plan catalog before trusting hardcoded test values.
16. Distinguish legacy code from currently used code.
17. Distinguish real performance issues from hypothetical micro-optimizations.
18. Distinguish intended redirect functionality from true open-redirect vulnerabilities.
19. Distinguish authentication from authorization.
20. Distinguish subscription deactivation from data deletion.
21. Explain uncertainty instead of pretending.
22. Every serious claim must point to concrete evidence in the repository.

Priority order:

`CORRECTNESS > SECURITY > DATA INTEGRITY > AUTHORIZATION > BUSINESS CONSISTENCY > MAINTAINABILITY > PERFORMANCE > CODE STYLE`

The objective is not to produce the longest possible report.

The objective is to produce the most useful and technically accurate map of what must be fixed before Linkzzz continues growing.
