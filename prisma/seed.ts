import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { defaultAppearance } from "../src/config/profile-defaults";
import { passwordHasher } from "../src/server/auth/password-hasher";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed the database.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const ADMIN_PASSWORD = process.env.DEV_ADMIN_PASSWORD ?? "LinkzzzAdmin!2026";
const SKYHOOK_PASSWORD = process.env.DEV_SKYHOOK_PASSWORD ?? "LinkzzzSky!2026";

async function ensureUser(input: { username: string; email: string; role: "ADMIN" | "CUSTOMER"; password: string }) {
  const user = await prisma.user.upsert({
    where: { username: input.username },
    create: { username: input.username, email: input.email, role: input.role, accountStatus: "ACTIVE" },
    update: { email: input.email, role: input.role, accountStatus: "ACTIVE" },
  });
  const passwordHash = await passwordHasher.hash(input.password);
  await prisma.passwordCredential.upsert({
    where: { userId: user.id },
    create: { userId: user.id, passwordHash, mustChangePassword: false },
    update: { passwordHash, mustChangePassword: false },
  });
  return user;
}

async function main() {
  await ensureUser({ username: "admin", email: "admin@linkzzz.local", role: "ADMIN", password: ADMIN_PASSWORD });
  const skyhook = await ensureUser({ username: "skyhook", email: "skyhook@linkzzz.local", role: "CUSTOMER", password: SKYHOOK_PASSWORD });
  await prisma.subscription.upsert({
    where: { userId: skyhook.id },
    create: { userId: skyhook.id, plan: "PREMIUM_PLUS", status: "ACTIVE", startsAt: new Date("2026-01-01T00:00:00.000Z"), endsAt: new Date("2027-01-01T00:00:00.000Z"), autoRenew: true },
    update: { plan: "PREMIUM_PLUS", status: "ACTIVE", endsAt: new Date("2027-01-01T00:00:00.000Z"), autoRenew: true },
  });
  await prisma.profile.upsert({
    where: { userId: skyhook.id },
    create: { userId: skyhook.id, slug: "skyhook", status: "PUBLISHED", displayName: "Skyhook", username: "skyhook", bio: "", appearance: defaultAppearance },
    update: {},
  });
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
