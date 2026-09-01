# Linkzzz server foundation

This directory is the server-side boundary for the backend phase.

Current Phase 0 contains only pure rules/contracts/security helpers. It intentionally does not implement persistence, real login or sessions because PostgreSQL/Prisma are not connected yet.

Rules:
- client state is never authoritative;
- server validates input;
- server authorizes every sensitive operation;
- plan/subscription rules are enforced server-side;
- repositories hide persistence details;
- route handlers/server actions should remain thin;
- sensitive actions write audit records.

Do not import server modules into client components.
