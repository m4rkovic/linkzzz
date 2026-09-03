import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { defaultAppearance } from "../src/config/profile-defaults";
import { passwordHasher } from "../src/server/auth/password-hasher";
import { requireDatabaseConnectionString } from "../src/server/config/postgres-connection-string";

const connectionString = requireDatabaseConnectionString();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const ADMIN_PASSWORD =
  process.env.DEV_ADMIN_PASSWORD ?? "LinkzzzAdmin!2026";
const SKYHOOK_PASSWORD =
  process.env.DEV_SKYHOOK_PASSWORD ?? "LinkzzzSky!2026";

async function ensureUser(input: {
  username: string;
  email: string;
  role: "ADMIN" | "CUSTOMER";
  password: string;
}) {
  const user = await prisma.user.upsert({
    where: { username: input.username },
    create: {
      username: input.username,
      email: input.email,
      role: input.role,
      accountStatus: "ACTIVE",
    },
    update: {
      email: input.email,
      role: input.role,
      accountStatus: "ACTIVE",
    },
  });

  const passwordHash = await passwordHasher.hash(input.password);
  await prisma.passwordCredential.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      passwordHash,
      mustChangePassword: false,
    },
    update: {
      passwordHash,
      mustChangePassword: false,
    },
  });

  return user;
}

function oneYearFromNow() {
  const value = new Date();
  value.setUTCFullYear(value.getUTCFullYear() + 1);
  return value;
}

async function seedSkyHookProfile(userId: string) {
  const landingPage = await prisma.smartLink.upsert({
    where: { slug: "skyhook" },
    create: {
      userId,
      type: "LANDING_PAGE",
      title: "Sky Hook",
      slug: "skyhook",
      status: "PUBLISHED",
    },
    update: {
      userId,
      type: "LANDING_PAGE",
      title: "Sky Hook",
      status: "PUBLISHED",
    },
  });

  const page = await prisma.page.upsert({
    where: { smartLinkId: landingPage.id },
    create: {
      smartLinkId: landingPage.id,
      displayName: "Sky Hook",
      username: "skyhook",
      bio: "Alternative rock band from Niš, Serbia.",
      locationLabel: "Niš, Serbia",
      appearance: defaultAppearance,
    },
    update: {
      displayName: "Sky Hook",
      username: "skyhook",
      bio: "Alternative rock band from Niš, Serbia.",
      locationLabel: "Niš, Serbia",
    },
  });

  if ((await prisma.pageCard.count({ where: { pageId: page.id } })) === 0) {
    await prisma.pageCard.createMany({
      data: [
        {
          id: "seed-card-spotify",
          pageId: page.id,
          title: "Listen on Spotify",
          description: "Stream our latest releases",
          url: "https://open.spotify.com/",
          platform: "spotify",
          layout: "featured",
          visible: true,
          sortOrder: 0,
          showDescription: true,
          overlayEnabled: true,
          overlayOpacity: 0.38,
          titlePosition: "bottom-center",
        },
        {
          id: "seed-card-instagram",
          pageId: page.id,
          title: "Instagram",
          description: "Follow us for updates",
          url: "https://instagram.com/",
          platform: "instagram",
          layout: "half",
          visible: true,
          sortOrder: 1,
          overlayEnabled: true,
          overlayOpacity: 0.38,
          titlePosition: "bottom-center",
        },
        {
          id: "seed-card-youtube",
          pageId: page.id,
          title: "Latest video",
          description: "Watch on YouTube",
          url: "https://youtube.com/",
          platform: "youtube",
          layout: "half",
          visible: true,
          sortOrder: 2,
          overlayEnabled: true,
          overlayOpacity: 0.38,
          titlePosition: "bottom-center",
        },
      ],
    });
  }

  if ((await prisma.socialLink.count({ where: { pageId: page.id } })) === 0) {
    await prisma.socialLink.createMany({
      data: [
        { id: "seed-social-instagram", pageId: page.id, name: "Instagram", platform: "instagram", url: "https://instagram.com/", visible: true, sortOrder: 0 },
        { id: "seed-social-youtube", pageId: page.id, name: "YouTube", platform: "youtube", url: "https://youtube.com/", visible: true, sortOrder: 1 },
        { id: "seed-social-spotify", pageId: page.id, name: "Spotify", platform: "spotify", url: "https://open.spotify.com/", visible: true, sortOrder: 2 },
        { id: "seed-social-facebook", pageId: page.id, name: "Facebook", platform: "facebook", url: "https://facebook.com/", visible: true, sortOrder: 3 },
      ],
    });
  }

  await prisma.smartLink.upsert({
    where: { slug: "skyhook-listen" },
    create: {
      userId,
      type: "DIRECT",
      title: "Sky Hook — Listen",
      slug: "skyhook-listen",
      status: "DRAFT",
      primaryDestination: {
        provider: "SPOTIFY",
        label: "Listen on Spotify",
        url: "https://open.spotify.com/",
        fallbackUrl: "https://open.spotify.com/",
      },
    },
    update: {
      userId,
      type: "DIRECT",
      title: "Sky Hook — Listen",
      status: "DRAFT",
    },
  });
}

async function main() {
  await ensureUser({
    username: "admin",
    email: "admin@linkzzz.local",
    role: "ADMIN",
    password: ADMIN_PASSWORD,
  });

  const skyhook = await ensureUser({
    username: "skyhook",
    email: "skyhook@linkzzz.local",
    role: "CUSTOMER",
    password: SKYHOOK_PASSWORD,
  });

  await prisma.subscription.upsert({
    where: { userId: skyhook.id },
    create: {
      userId: skyhook.id,
      plan: "PRO",
      status: "ACTIVE",
      startsAt: new Date(),
      endsAt: oneYearFromNow(),
      autoRenew: true,
    },
    update: {
      plan: "PRO",
      status: "ACTIVE",
      endsAt: oneYearFromNow(),
      autoRenew: true,
    },
  });

  await seedSkyHookProfile(skyhook.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
