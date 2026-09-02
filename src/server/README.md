# Linkzzz server boundary

The application backend is implemented behind repository and service contracts.
Prisma/PostgreSQL is the only application runtime persistence adapter. Legacy
JSON persistence has been removed; new repositories must target Prisma only.

Current rules:

- client state is never authoritative;
- every mutating route validates origin and input;
- authentication and authorization are enforced server-side;
- plan and subscription rules are enforced server-side;
- services depend on repository contracts, not directly on Prisma;
- sensitive administrative actions write audit records;
- production rate limiting uses shared Upstash storage;
- production assets use S3-compatible object storage.

Do not import server modules into client components.
